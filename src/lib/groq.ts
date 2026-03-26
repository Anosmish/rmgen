import { GitHubRepoDetails } from "@/types/github";
import { RepoAnalysisMetadata } from "@/types/repo-analyzer";
import { ReadmeTemplate } from "@/types/readme";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const FALLBACK_PREVIEW_IMAGE = "https://via.placeholder.com/800x400?text=Project+Preview";

const TEMPLATE_GUIDANCE: Record<ReadmeTemplate, string> = {
  default: "Use a balanced professional style suitable for most software repositories.",
  startup:
    "Position the project like a startup-ready product: emphasize value proposition, architecture clarity, and deployment readiness.",
  ai: "Emphasize model behavior, prompts, evaluation, and responsible AI usage notes where relevant.",
  library:
    "Focus on API surface, install/import examples, versioning strategy, and concise developer documentation.",
};

function createPrompt(
  repository: GitHubRepoDetails,
  analysis: RepoAnalysisMetadata,
  template: ReadmeTemplate,
  customContext?: string,
): string {
  const topics = repository.topics.length ? repository.topics.join(", ") : "Not specified";
  const languageBreakdown =
    repository.language_breakdown.length > 0
      ? repository.language_breakdown.join(", ")
      : repository.language ?? "Unknown";
  const stack = analysis.detectedStack.length
    ? analysis.detectedStack.join(", ")
    : languageBreakdown;
  const dependencies = analysis.dependencies.length
    ? analysis.dependencies.slice(0, 90).join(", ")
    : "No explicit dependencies detected";
  const screenshotList = analysis.screenshots.length
    ? analysis.screenshots.join("\n")
    : FALLBACK_PREVIEW_IMAGE;
  const heroImage = analysis.screenshots[0] ?? FALLBACK_PREVIEW_IMAGE;
  const topFolders = analysis.topLevelFolders.length
    ? analysis.topLevelFolders.join(", ")
    : "No top-level folders detected";

  return [
    "Generate a production-grade README.md in pure markdown (no code fences around the full output).",
    "Write like a senior developer and technical product architect.",
    "Make it GitHub trending quality: sharp hook, concrete value, and realistic implementation details.",
    "Avoid generic filler language at all costs.",
    "",
    "Mandatory structure to include in this order:",
    "1) Title + one-line tagline",
    "2) Clean badges line",
    "3) Hero preview image",
    "4) Introduction / strong hook",
    "5) Problem -> Solution",
    "6) Why this project matters",
    "7) Features",
    "8) Tech Stack",
    "9) Installation",
    "10) Usage",
    "11) Project structure (when meaningful)",
    "12) 📸 Screenshots / Demo",
    "13) Contributing",
    "14) License",
    "",
    "Hard constraints:",
    "- Badges must be valid markdown images using shields.io.",
    "- Include at least 3 and at most 6 badges.",
    "- Include exactly one hero image near the top.",
    "- Use realistic commands and examples based on detected stack.",
    "- Do not fabricate non-obvious project internals; infer responsibly.",
    "- Maintain clear, skimmable section formatting.",
    "",
    "Repository context:",
    `- Name: ${repository.name}`,
    `- Full Name: ${repository.full_name}`,
    `- Description: ${repository.description ?? "No explicit description provided."}`,
    `- Project Type (inferred): ${analysis.projectType}`,
    `- Primary Language: ${repository.language ?? "Unknown"}`,
    `- Languages: ${languageBreakdown}`,
    `- Topics: ${topics}`,
    `- Visibility: ${repository.visibility}`,
    `- Stars: ${repository.stargazers_count}`,
    `- Forks: ${repository.forks_count}`,
    `- Open Issues: ${repository.open_issues_count}`,
    `- Default Branch: ${repository.default_branch}`,
    `- Homepage: ${repository.homepage ?? "Not set"}`,
    `- License: ${repository.license?.name ?? "No license specified"}`,
    `- Detected Stack: ${stack}`,
    `- Detected Frameworks: ${analysis.frameworks.join(", ") || "None"}`,
    `- Databases/Tools: ${analysis.databasesAndTools.join(", ") || "None"}`,
    `- Dependency Signals: ${dependencies}`,
    `- Top-level folders: ${topFolders}`,
    `- Existing README summary: ${analysis.existingReadmeSummary ?? "None"}`,
    `- Hero image URL to use by default: ${heroImage}`,
    `- Screenshot URLs to include in the screenshots section:\n${screenshotList}`,
    "",
    `Style guidance: ${TEMPLATE_GUIDANCE[template]}`,
    customContext ? `Additional project notes: ${customContext}` : "",
    "",
    "Output quality bar:",
    "- Crisp, technical, and compelling narrative.",
    "- Highly actionable setup and usage docs.",
    "- Reader should understand value in under 20 seconds.",
  ]
    .filter(Boolean)
    .join("\n");
}

function stripMarkdownCodeFence(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```")) {
    return trimmed;
  }

  const lines = trimmed.split("\n");
  return lines.slice(1, -1).join("\n").trim();
}

export async function generateReadmeFromGroq(params: {
  repository: GitHubRepoDetails;
  analysis: RepoAnalysisMetadata;
  template: ReadmeTemplate;
  customContext?: string;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const { repository, analysis, template, customContext } = params;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content:
            "You are an elite senior software engineer and technical writer producing viral, developer-trusted README.md files.",
        },
        {
          role: "user",
          content: createPrompt(repository, analysis, template, customContext),
        },
      ],
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };

    throw new Error(payload.error?.message ?? "Failed to generate README from Groq.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const generated = payload.choices?.[0]?.message?.content;
  if (!generated) {
    throw new Error("Groq returned an empty response.");
  }

  return stripMarkdownCodeFence(generated);
}
