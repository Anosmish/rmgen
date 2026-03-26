import { NextRequest, NextResponse } from "next/server";

import { fetchUserRepos, GitHubApiError } from "@/lib/github";
import { getAuthSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await fetchUserRepos(session.accessToken);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query")?.trim().toLowerCase() ?? "";
    const visibility = searchParams.get("visibility") ?? "all";
    const language = searchParams.get("language") ?? "all";

    const filtered = repos.filter((repo) => {
      const matchesQuery =
        !query ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false);
      const matchesVisibility = visibility === "all" || repo.visibility === visibility;
      const matchesLanguage = language === "all" || repo.language === language;
      return matchesQuery && matchesVisibility && matchesLanguage;
    });

    const languages = Array.from(
      new Set(repos.map((repo) => repo.language).filter(Boolean) as string[]),
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ repos: filtered, languages }, { status: 200 });
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
        error: "Unexpected error while fetching repositories.",
      },
      { status: 500 },
    );
  }
}
