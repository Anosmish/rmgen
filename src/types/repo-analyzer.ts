export type ProjectType = "AI app" | "Web app" | "Library" | "CLI tool";

export interface RepoAnalysisMetadata {
  projectType: ProjectType;
  detectedStack: string[];
  dependencies: string[];
  hasScreenshots: boolean;
  screenshots: string[];
  frameworks: string[];
  databasesAndTools: string[];
  existingReadmeSummary: string | null;
  topLevelFolders: string[];
}
