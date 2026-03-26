import type { ReadmeTemplate } from "@/types/readme";

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  summary: string;
  template: ReadmeTemplate;
  contextSeed: string;
}
