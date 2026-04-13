import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchRepoDetails, GitHubApiError } from "@/lib/github";
import { generateReadmeFromGroq } from "@/lib/groq";
import { analyzeRepository } from "@/lib/repo-analyzer";
import { getAuthSession } from "@/lib/session";
import { consumeDailyUsageLimit } from "@/lib/usage-limit";
import { GitHubRepoDetails } from "@/types/github";
import { RepoAnalysisMetadata } from "@/types/repo-analyzer";

const generateReadmeSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  template: z.enum(["default", "startup", "ai", "library"]).default("default"),
  customContext: z.string().max(2000).optional(),
});

// Hard cap on repository analysis time to keep API responses under Vercel's function timeout.
const ANALYSIS_TIMEOUT_MS = 8000;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.accessToken || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = generateReadmeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const usage = consumeDailyUsageLimit();

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Daily generation limit reached. Please try again tomorrow.",
        },
        { status: 429 },
      );
    }

    const repository = await fetchRepoDetails(
      parsed.data.owner,
      parsed.data.repo,
      session.accessToken,
    );

    let analysisWarning: string | undefined;
    let analysis: RepoAnalysisMetadata;

    try {
      const analysisTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Repository analysis timed out.")), ANALYSIS_TIMEOUT_MS),
      );

      analysis = await Promise.race([
        analyzeRepository({
          owner: parsed.data.owner,
          repo: parsed.data.repo,
          accessToken: session.accessToken,
          defaultBranch: repository.default_branch,
        }),
        analysisTimeout,
      ]);
    } catch (error) {
      analysisWarning =
        "Repository analysis partially failed. README generation continued with minimal metadata.";

      analysis = {
        projectType: "Web app",
        detectedStack: repository.language ? [repository.language] : [],
        dependencies: [],
        hasScreenshots: false,
        screenshots: ["https://via.placeholder.com/800x400?text=Project+Preview"],
        frameworks: [],
        databasesAndTools: [],
        existingReadmeSummary: null,
        topLevelFolders: [],
      };

      console.error("Repository analyzer fallback triggered:", error);
    }

    const repositoryForPrompt: GitHubRepoDetails = {
      ...repository,
      full_name: repository.full_name || `${parsed.data.owner}/${parsed.data.repo}`,
      language: repository.language ?? repository.language_breakdown?.[0] ?? "Unknown",
      license: repository.license ?? {
        key: "mit",
        name: "MIT",
        spdx_id: "MIT",
      },
    };

    const readme = await generateReadmeFromGroq({
      repository: repositoryForPrompt,
      analysis,
      template: parsed.data.template,
      customContext: parsed.data.customContext,
    });

    return NextResponse.json(
      {
        readme,
        remainingGenerations: usage.remaining,
        analysis,
        analysisWarning,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        {
          error: error.message,
          rateLimitReset: error.rateLimitReset,
        },
        { status: error.status },
      );
    }

    if (error instanceof Error && error.message === "GROQ_RATE_LIMIT") {
      return NextResponse.json(
        { error: "AI rate limit hit. Please wait 30 seconds and try again." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "README generation failed.",
      },
      { status: 500 },
    );
  }
}
