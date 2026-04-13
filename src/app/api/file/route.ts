import { NextResponse } from "next/server";
import { z } from "zod";

import { githubFetch, GitHubApiError } from "@/lib/github";
import { getAuthSession } from "@/lib/session";

const getQuerySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  ref: z.string().optional(),
});

const putBodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  content: z.string(),
  sha: z.string().optional(),
  branch: z.string().optional(),
  message: z.string().min(1).max(200).optional(),
});

interface GitHubFileContent {
  content: string;
  sha: string;
  name: string;
  path: string;
  size: number;
  type: string;
}

const GITHUB_API_BASE = "https://api.github.com";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = getQuerySchema.safeParse({
    owner: searchParams.get("owner"),
    repo: searchParams.get("repo"),
    path: searchParams.get("path"),
    ref: searchParams.get("ref") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { owner, repo, path, ref } = parsed.data;

  try {
    const url = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
    const fileData = await githubFetch<GitHubFileContent>(url, session.accessToken);

    if (fileData.type !== "file") {
      return NextResponse.json({ error: "Path is not a file." }, { status: 400 });
    }

    const decoded = Buffer.from(
      fileData.content.replace(/\n/g, ""),
      "base64",
    ).toString("utf8");

    return NextResponse.json({ content: decoded, sha: fileData.sha, path: fileData.path });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, rateLimitReset: error.rateLimitReset },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch file content." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = putBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { owner, repo, path, content, sha, branch, message } = parsed.data;

    const encoded = Buffer.from(content, "utf8").toString("base64");

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${session.accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message ?? `chore: update ${path}`,
          content: encoded,
          sha: sha ?? undefined,
          branch: branch ?? undefined,
        }),
      },
    );

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      return NextResponse.json(
        { error: payload.message ?? `GitHub API error: ${response.status}` },
        { status: response.status },
      );
    }

    const result = (await response.json()) as {
      content: { sha: string; path: string };
      commit?: { html_url?: string };
    };

    return NextResponse.json({
      sha: result.content.sha,
      path: result.content.path,
      commitUrl: result.commit?.html_url ?? null,
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, rateLimitReset: error.rateLimitReset },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save file." },
      { status: 500 },
    );
  }
}
