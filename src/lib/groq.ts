import { GitHubRepoDetails } from "@/types/github";
import { ReadmeTemplate } from "@/types/readme";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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
  template: ReadmeTemplate,
  customContext?: string,
): string {
  const topics = repository.topics.length ? repository.topics.join(", ") : "None provided";
  const languageBreakdown = repository.language_breakdown.length
    ? repository.language_breakdown.join(", ")
    : repository.language ?? "Unknown";

  return [
    "Generate a complete professional README.md in markdown only.",
    "The output must include these sections in this order:",
    "1) Title",
    "2) Description",
    "3) Badges",
    "4) Features",
    "5) Tech Stack",
    "6) Installation",
    "7) Usage",
    "8) Contributing",
    "9) License",
    "",
    "Repository context:",
    `- Name: ${repository.name}`,
    `- Full Name: ${repository.full_name}`,
    `- Description: ${repository.description ?? "No description provided."}`,
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
    "",
    `Style guidance: ${TEMPLATE_GUIDANCE[template]}`,
    customContext ? `Additional project notes: ${customContext}` : "",
    "",
    "Constraints:",
    "- Return plain markdown content only, no code fences.",
    "- Keep language concise, technical, and actionable.",
    "- Include realistic command examples.",
    "- If license is unknown, use MIT as a recommendation and mention it clearly.",
    "- Add useful badges for build, license, language, and stars.",
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
  template: ReadmeTemplate;
  customContext?: string;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const { repository, template, customContext } = params;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      temperature: 0.35,
      max_tokens: 2200,
      messages: [
        {
          role: "system",
          content:
            "You are a senior developer technical writer. Produce production-grade README.md files.",
        },
        {
          role: "user",
          content: createPrompt(repository, template, customContext),
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
