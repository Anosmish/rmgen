export type RepoVisibility = "all" | "public" | "private";

export interface GitHubOwner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
  visibility: "public" | "private";
  owner: GitHubOwner;
  topics: string[];
}

export interface GitHubRepoDetails extends GitHubRepo {
  homepage: string | null;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  language_breakdown: string[];
}

export interface RepoFilters {
  query: string;
  visibility: RepoVisibility;
  language: string;
}
