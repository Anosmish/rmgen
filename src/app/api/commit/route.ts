import { NextResponse } from "next/server";
import { z } from "zod";

import { commitReadmeToGithub, GitHubApiError } from "@/lib/github";
import { getAuthSession } from "@/lib/session";

const commitReadmeSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  content: z.string().min(1),
  branch: z.string().optional(),
  message: z.string().min(3).max(120).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = commitReadmeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await commitReadmeToGithub({
      owner: parsed.data.owner,
      repo: parsed.data.repo,
      accessToken: session.accessToken,
      content: parsed.data.content,
      branch: parsed.data.branch,
      message: parsed.data.message,
    });

    return NextResponse.json(result, { status: 200 });
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
        error: error instanceof Error ? error.message : "Failed to commit README.md.",
      },
      { status: 500 },
    );
  }
}
