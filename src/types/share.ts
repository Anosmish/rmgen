import type { ReadmeTemplate } from "@/types/readme";

export interface SharedReadmeRecord {
  id: string;
  readme: string;
  repoFullName: string;
  template: ReadmeTemplate;
  createdAt: string;
  createdBy: string;
}

export interface CreateShareRequest {
  readme: string;
  repoFullName: string;
  template: ReadmeTemplate;
}
