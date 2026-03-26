import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchRepoDetails, GitHubApiError } from "@/lib/github";
import { generateReadmeFromGroq } from "@/lib/groq";
import { getAuthSession } from "@/lib/session";
import { consumeDailyUsageLimit } from "@/lib/usage-limit";

const generateReadmeSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  template: z.enum(["default", "startup", "ai", "library"]).default("default"),
  customContext: z.string().max(2000).optional(),
});

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

    const usageKey = session.user.id || session.user.email || "anonymous";
    const usage = consumeDailyUsageLimit(usageKey);

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

    const readme = await generateReadmeFromGroq({
      repository,
      template: parsed.data.template,
      customContext: parsed.data.customContext,
    });

    return NextResponse.json(
      {
        readme,
        remainingGenerations: usage.remaining,
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

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "README generation failed.",
      },
      { status: 500 },
    );
  }
}
