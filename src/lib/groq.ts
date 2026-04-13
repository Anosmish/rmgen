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

function toUrlSafeText(input: string): string {
  return encodeURIComponent(input).replace(/%20/g, "+");
}

function sanitizeLicenseBadgeValue(input: string): string {
  return encodeURIComponent(input.replace(/\s+/g, "-").replace(/\//g, "-"));
}

function buildTypingHeaderUrl(projectName: string): string {
  return `https://readme-typing-svg.herokuapp.com?size=28&duration=3000&color=00F7FF&center=true&vCenter=true&width=800&lines=${toUrlSafeText(projectName)};AI+Powered+Tool;Built+for+Developers`;
}

function resolveHeroImage(repository: GitHubRepoDetails, analysis: RepoAnalysisMetadata): string {
  if (analysis.screenshots.length > 0) {
    return analysis.screenshots[0];
  }

  return `https://via.placeholder.com/1000x400?text=${toUrlSafeText(repository.name)}`;
}

function buildPremiumHeader(repository: GitHubRepoDetails, analysis: RepoAnalysisMetadata): string {
  const typingHeader = buildTypingHeaderUrl(repository.name);
  const heroImage = resolveHeroImage(repository, analysis);
  const badgeLicense = sanitizeLicenseBadgeValue(repository.license?.name ?? "MIT");
  const tagline =
    repository.description?.trim() ||
    "An exceptional developer-first project focused on clarity, speed, and real-world impact.";

  return [
    `# ${repository.name}`,
    "",
    '<p align="center">',
    `  <img src="${typingHeader}" />`,
    "</p>",
    "",
    `> ${tagline}`,
    "",
    '<p align="center">',
    `  <img src="https://img.shields.io/github/stars/${repository.full_name}?style=social" />`,
    `  <img src="https://img.shields.io/github/forks/${repository.full_name}?style=social" />`,
    `  <img src="https://img.shields.io/badge/license-${badgeLicense}-blue" />`,
    "</p>",
    "",
    '<p align="center">',
    `  <img src="${heroImage}" />`,
    "</p>",
  ].join("\n");
}

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
  const heroImage = resolveHeroImage(repository, analysis);
  const topFolders = analysis.topLevelFolders.length
    ? analysis.topLevelFolders.join(", ")
    : "No top-level folders detected";
  const typingHeader = buildTypingHeaderUrl(repository.name);
  const badgeLicense = sanitizeLicenseBadgeValue(repository.license?.name ?? "MIT");

  return [
    "Generate a showcase-level README.md that looks like a premium landing page for GitHub.",
    "Return markdown + inline HTML only, and never wrap the entire output in a code block.",
    "Write like a senior engineer and product-minded developer advocate.",
    "Make a strong first impression with visual hierarchy and punchy language.",
    "",
    "MANDATORY HERO START (use this pattern exactly, with repository values):",
    `# ${repository.name}`,
    "",
    '<p align="center">',
    `  <img src="${typingHeader}" />`,
    "</p>",
    "",
    "Tagline: one high-impact sentence.",
    "",
    "Use centered badges with HTML (NOT markdown badges):",
    '<p align="center">',
    `  <img src="https://img.shields.io/github/stars/${repository.full_name}?style=social" />`,
    `  <img src="https://img.shields.io/github/forks/${repository.full_name}?style=social" />`,
    `  <img src="https://img.shields.io/badge/license-${badgeLicense}-blue" />`,
    "</p>",
    "",
    "Hero image below badges:",
    '<p align="center">',
    `  <img src="${heroImage}" />`,
    "</p>",
    "",
    "MANDATORY README STRUCTURE:",
    "- ✨ Highlights (3-5 punchy bullets)",
    "- 🚀 Features (emoji bullets, one line each, real value)",
    "- 🔥 Problem -> Solution",
    "- 🧱 Tech Stack (grouped, use detected stack)",
    "- ⚡ Quick Start (copy-paste commands)",
    "- 📸 Screenshots / Demo (markdown images only: ![Demo](image_url))",
    "- 📂 Project Structure (tree format)",
    "- 🤝 Contributing (friendly and short)",
    "- 📄 License (use detected license, fallback to MIT)",
    "",
    "DESIGN RULES:",
    "- Use emoji headings (for example: ✨ 🚀 📦 🔥).",
    "- Use section separators: ---",
    "- Keep spacing clean and skimmable.",
    "- Avoid long paragraphs and generic filler.",
    "- Make it feel like a premium SaaS launch page.",
    "",
    "FINAL OUTPUT RULES:",
    "- Return only README content (no explanatory text).",
    "- No plain text badges.",
    "- No raw URLs by themselves; image URLs must be markdown images unless used in required HTML blocks.",
    "- Preserve HTML sections for centered layout and hero animation.",
    "- Do not include labels like 'Hero Image' in final output.",
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

function normalizeLeadingMarkdownLabel(markdown: string): string {
  return markdown.replace(/^markdown\s*\n/i, "").trim();
}

function looksLikeImageUrl(url: string): boolean {
  return (
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ||
    /via\.placeholder\.com/i.test(url) ||
    /raw\.githubusercontent\.com/i.test(url)
  );
}

function normalizeUrlOnlyLine(line: string): string {
  const plainUrlMatch = line.match(/^\s*(?:[-*]\s+)?(https?:\/\/\S+)\s*$/i);
  if (!plainUrlMatch) {
    return line;
  }

  const url = plainUrlMatch[1];
  if (looksLikeImageUrl(url)) {
    return `![Demo](${url})`;
  }

  return `[Project Link](${url})`;
}

function normalizeBadgeLine(line: string): string {
  const badgeMatch = line.match(/^\s*(https?:\/\/img\.shields\.io\S+)\s*$/i);
  if (!badgeMatch) {
    return line;
  }

  return `<img src="${badgeMatch[1]}" />`;
}

function removeDisallowedMarkerLines(line: string): string | null {
  if (/^\s*#+\s*hero\s*image\s*:?\s*$/i.test(line)) {
    return null;
  }

  if (/^\s*hero\s*image\s*:?\s*$/i.test(line)) {
    return null;
  }

  return line;
}

function ensureRequiredSections(markdown: string, analysis: RepoAnalysisMetadata): string {
  let output = markdown;

  if (!/^\s*##\s+📸\s+Screenshots\s*\/\s*Demo/im.test(output)) {
    const screenshots = analysis.screenshots.length > 0 ? analysis.screenshots : [FALLBACK_PREVIEW_IMAGE];
    const screenshotLines = screenshots.map((url) => `![Demo](${url})`).join("\n\n");
    output = `${output}\n\n---\n\n## 📸 Screenshots / Demo\n\n${screenshotLines}`;
  }

  if (!/^\s*##\s+📄\s+License/im.test(output)) {
    output = `${output}\n\n---\n\n## 📄 License\n\nMIT`;
  }

  return output;
}

function normalizeReadmeSpacing(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanGeneratedReadme(
  markdown: string,
  repository: GitHubRepoDetails,
  analysis: RepoAnalysisMetadata,
): string {
  const headerFallback = buildPremiumHeader(repository, analysis);

  const lines = normalizeLeadingMarkdownLabel(stripMarkdownCodeFence(markdown))
    .split("\n")
    .map((line) => removeDisallowedMarkerLines(line))
    .filter((line): line is string => line !== null)
    .map((line) => normalizeBadgeLine(line))
    .map((line) => {
      if (/<\/?(p|img)\b/i.test(line)) {
        return line;
      }

      if (/!\[[^\]]*\]\([^\)]+\)/.test(line) || /\[[^\]]+\]\([^\)]+\)/.test(line)) {
        return line;
      }

      return normalizeUrlOnlyLine(line);
    });

  let output = lines.join("\n");

  if (!/readme-typing-svg\.herokuapp\.com/i.test(output)) {
    output = `${headerFallback}\n\n---\n\n${output}`;
  }

  output = ensureRequiredSections(output, analysis);
  output = normalizeReadmeSpacing(output);

  return output;
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
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096,
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
    if (response.status === 429) {
      throw new Error("GROQ_RATE_LIMIT");
    }

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

  return cleanGeneratedReadme(generated, repository, analysis);
}
