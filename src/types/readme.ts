import type { RepoAnalysisMetadata } from "@/types/repo-analyzer";

export type ReadmeTemplate = "default" | "startup" | "ai" | "library";

export interface GenerateReadmeRequest {
  owner: string;
  repo: string;
  template: ReadmeTemplate;
  customContext?: string;
}

export interface CommitReadmeRequest {
  owner: string;
  repo: string;
  content: string;
  branch?: string;
  message?: string;
}

export interface GenerateReadmeResponse {
  readme: string;
  remainingGenerations: number;
  analysis?: RepoAnalysisMetadata;
  analysisWarning?: string;
}
