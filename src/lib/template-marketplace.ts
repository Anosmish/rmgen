import type { TemplatePreset } from "@/types/template-marketplace";

export const TEMPLATE_MARKETPLACE_PRESETS: TemplatePreset[] = [
  {
    id: "saas-launch",
    name: "SaaS Launch",
    category: "Growth",
    summary: "Position your repo like a product launch with value proposition, proof points, and onboarding clarity.",
    template: "startup",
    contextSeed:
      "Emphasize business value, user persona, activation flow, and developer onboarding in under 5 minutes.",
  },
  {
    id: "oss-trending",
    name: "OSS Trending",
    category: "Community",
    summary: "Optimize for open-source credibility with contribution clarity, architecture confidence, and social proof.",
    template: "default",
    contextSeed:
      "Highlight maintainability, contributor onboarding, roadmap hints, and trust-building details.",
  },
  {
    id: "ai-builder",
    name: "AI Builder",
    category: "AI",
    summary: "Show model behavior, prompt strategy, evaluation signals, and practical limitations responsibly.",
    template: "ai",
    contextSeed:
      "Include model/prompt context, expected outputs, failure modes, and responsible AI usage guidelines.",
  },
  {
    id: "dev-tooling",
    name: "Dev Tooling",
    category: "Developer Tool",
    summary: "Document installation, commands, APIs, and integration pathways for fast adoption by engineers.",
    template: "library",
    contextSeed:
      "Focus on command examples, API snippets, integration patterns, and versioning expectations.",
  },
];
