import { NextResponse } from "next/server";
import { z } from "zod";

import { githubFetch, GitHubApiError } from "@/lib/github";
import { getAuthSession } from "@/lib/session";

const querySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
});

interface GitHubBranch {
  commit: { sha: string };
}

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    owner: searchParams.get("owner"),
    repo: searchParams.get("repo"),
    branch: searchParams.get("branch") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { owner, repo, branch } = parsed.data;

  try {
    const branchName =
      branch ??
      (
        await githubFetch<{ default_branch: string }>(
          `/repos/${owner}/${repo}`,
          session.accessToken,
        )
      ).default_branch;

    const branchData = await githubFetch<GitHubBranch>(
      `/repos/${owner}/${repo}/branches/${branchName}`,
      session.accessToken,
    );

    const treeSha = branchData.commit.sha;

    const treeData = await githubFetch<GitHubTreeResponse>(
      `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
      session.accessToken,
    );

    return NextResponse.json({ tree: treeData.tree, truncated: treeData.truncated });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json(
        { error: error.message, rateLimitReset: error.rateLimitReset },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch file tree." },
      { status: 500 },
    );
  }
}
