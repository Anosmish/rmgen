import { GitHubRepo, GitHubRepoDetails } from "@/types/github";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  status: number;
  rateLimitReset?: string;

  constructor(message: string, status: number, rateLimitReset?: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.rateLimitReset = rateLimitReset;
  }
}

function getRateLimitResetIso(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const asNumber = Number(value);
  if (Number.isNaN(asNumber)) {
    return undefined;
  }

  return new Date(asNumber * 1000).toISOString();
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      return payload.message;
    }
  } catch {
    return `GitHub API request failed with status ${response.status}.`;
  }

  return `GitHub API request failed with status ${response.status}.`;
}

async function githubFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const isRateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";

    throw new GitHubApiError(
      await parseErrorMessage(response),
      response.status,
      isRateLimited ? getRateLimitResetIso(response.headers.get("x-ratelimit-reset")) : undefined,
    );
  }

  return (await response.json()) as T;
}

export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const repos = await githubFetch<GitHubRepo[]>(
    "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
    accessToken,
  );

  return repos
    .map((repo) => ({
      ...repo,
      visibility: repo.private ? ("private" as const) : ("public" as const),
      topics: repo.topics ?? [],
    }))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

export async function fetchRepoDetails(
  owner: string,
  repo: string,
  accessToken: string,
): Promise<GitHubRepoDetails> {
  const [repoData, languageData] = await Promise.all([
    githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`, accessToken),
    githubFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`, accessToken),
  ]);

  return {
    ...repoData,
    visibility: repoData.private ? "private" : "public",
    topics: repoData.topics ?? [],
    homepage: (repoData as GitHubRepoDetails).homepage ?? null,
    license: (repoData as GitHubRepoDetails).license ?? null,
    language_breakdown: Object.keys(languageData),
  };
}

export async function getReadmeSha(
  owner: string,
  repo: string,
  accessToken: string,
  branch?: string,
): Promise<string | null> {
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`);
  if (branch) {
    url.searchParams.set("ref", branch);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const isRateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";

    throw new GitHubApiError(
      await parseErrorMessage(response),
      response.status,
      isRateLimited ? getRateLimitResetIso(response.headers.get("x-ratelimit-reset")) : undefined,
    );
  }

  const payload = (await response.json()) as { sha: string };
  return payload.sha;
}

export async function commitReadmeToGithub(params: {
  owner: string;
  repo: string;
  accessToken: string;
  content: string;
  branch?: string;
  message?: string;
}): Promise<{ action: "created" | "updated"; commitUrl: string | null; sha: string }> {
  const { owner, repo, accessToken, content, branch, message } = params;
  const existingSha = await getReadmeSha(owner, repo, accessToken, branch);

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/README.md`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message:
          message ??
          (existingSha
            ? "docs: update README.md with AI GitHub README Generator"
            : "docs: add README.md with AI GitHub README Generator"),
        content: Buffer.from(content, "utf8").toString("base64"),
        sha: existingSha ?? undefined,
        branch: branch ?? undefined,
      }),
    },
  );

  if (!response.ok) {
    const isRateLimited =
      response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";

    throw new GitHubApiError(
      await parseErrorMessage(response),
      response.status,
      isRateLimited ? getRateLimitResetIso(response.headers.get("x-ratelimit-reset")) : undefined,
    );
  }

  const payload = (await response.json()) as {
    content: { sha: string };
    commit?: { html_url?: string };
  };

  return {
    action: existingSha ? "updated" : "created",
    commitUrl: payload.commit?.html_url ?? null,
    sha: payload.content.sha,
  };
}
