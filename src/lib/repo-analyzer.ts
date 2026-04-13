import { GitHubApiError, githubFetch } from "@/lib/github";
import { ProjectType, RepoAnalysisMetadata } from "@/types/repo-analyzer";

const GITHUB_API_BASE = "https://api.github.com";
// Conservative caps to keep analysis fast and avoid GitHub API rate limits.
// MAX_SCAN_FILES=200 and MAX_SCAN_DEPTH=3 cover the vast majority of project structures
// while completing within the API route's 8-second analysis budget.
const MAX_SCAN_FILES = 200;
const MAX_SCAN_DEPTH = 3;
const FALLBACK_PREVIEW_IMAGE = "https://via.placeholder.com/800x400?text=Project+Preview";

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|svg)$/i;
const SCREENSHOT_FOLDER_PATTERN = /(^|\/)(public|assets?|screenshots?)(\/|$)/i;

interface GitHubContentEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  content?: string;
  encoding?: string;
}

interface RepositoryWalkItem {
  path: string;
  type: "file" | "dir";
}

interface AnalyzeRepositoryParams {
  owner: string;
  repo: string;
  accessToken: string;
  defaultBranch: string;
}

const FRAMEWORK_MAP: Record<string, string> = {
  next: "Next.js",
  react: "React",
  "react-dom": "React",
  vue: "Vue",
  nuxt: "Nuxt",
  svelte: "Svelte",
  "@angular/core": "Angular",
  express: "Express",
  fastify: "Fastify",
  nestjs: "NestJS",
  "@nestjs/core": "NestJS",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
};

const DATABASE_AND_TOOLS_MAP: Record<string, string> = {
  prisma: "Prisma",
  mongoose: "Mongoose",
  mongodb: "MongoDB",
  pg: "PostgreSQL",
  mysql2: "MySQL",
  sqlite3: "SQLite",
  redis: "Redis",
  sequelize: "Sequelize",
  typeorm: "TypeORM",
  "drizzle-orm": "Drizzle ORM",
  supabase: "Supabase",
  firebase: "Firebase",
  docker: "Docker",
};

const AI_TOOLING = new Set([
  "openai",
  "groq-sdk",
  "langchain",
  "@langchain/core",
  "transformers",
  "torch",
  "tensorflow",
  "sentence-transformers",
  "huggingface-hub",
  "llama-index",
]);

const CLI_TOOLING = new Set(["commander", "yargs", "oclif", "click", "typer"]);

function encodeGithubPath(path: string): string {
  if (!path) {
    return "";
  }

  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeDependencyName(value: string): string {
  return value.trim().toLowerCase();
}

function getRawGitHubUrl(owner: string, repo: string, branch: string, path: string): string {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
}

function parsePythonRequirements(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/[<>=!~\[]/)[0].trim().toLowerCase())
    .filter(Boolean);
}

function parseDockerfileForTooling(content: string): string[] {
  const normalized = content.toLowerCase();
  const tools = new Set<string>();

  if (normalized.includes("node:")) {
    tools.add("Node.js");
  }

  if (normalized.includes("python:")) {
    tools.add("Python");
  }

  if (normalized.includes("postgres") || normalized.includes("pg_isready")) {
    tools.add("PostgreSQL");
  }

  tools.add("Docker");

  return Array.from(tools);
}

function summarizeExistingReadme(content: string): string | null {
  const summary = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("![") && !line.startsWith("[!["))
    .slice(0, 8)
    .join(" ");

  return summary ? summary.slice(0, 420) : null;
}

function pickClosestToRoot(paths: string[], target: RegExp): string | null {
  const matched = paths.filter((path) => target.test(path));
  if (!matched.length) {
    return null;
  }

  matched.sort((a, b) => a.split("/").length - b.split("/").length);
  return matched[0] ?? null;
}

async function fetchContentListing(
  owner: string,
  repo: string,
  accessToken: string,
  path: string,
  ref: string,
): Promise<GitHubContentEntry[]> {
  const encodedPath = encodeGithubPath(path);
  const pathSegment = encodedPath ? `/${encodedPath}` : "";
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents${pathSegment}`);
  url.searchParams.set("ref", ref);

  const payload = await githubFetch<GitHubContentEntry[] | GitHubContentEntry>(
    url.pathname + url.search,
    accessToken,
  );

  return Array.isArray(payload) ? payload : [payload];
}

async function fetchTextFileContent(params: {
  owner: string;
  repo: string;
  accessToken: string;
  path: string;
  ref: string;
}): Promise<string | null> {
  const { owner, repo, accessToken, path, ref } = params;
  const encodedPath = encodeGithubPath(path);
  const url = new URL(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}`);
  url.searchParams.set("ref", ref);

  const payload = await githubFetch<GitHubContentEntry>(url.pathname + url.search, accessToken);

  if (payload.content && payload.encoding === "base64") {
    return Buffer.from(payload.content, "base64").toString("utf8");
  }

  if (!payload.download_url) {
    return null;
  }

  const downloadResponse = await fetch(payload.download_url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!downloadResponse.ok) {
    return null;
  }

  return downloadResponse.text();
}

function shouldDescendDirectory(path: string, depth: number): boolean {
  if (depth < 2) {
    return true;
  }

  return /(^|\/)(apps?|packages?|services?|src|public|assets?|screenshots?|examples?|docs)(\/|$)/i.test(
    path,
  );
}

function inferProjectType(params: {
  hasAiDependencies: boolean;
  hasCliSignals: boolean;
  frameworks: string[];
  packageJsonHasLibrarySignals: boolean;
}): ProjectType {
  const { hasAiDependencies, hasCliSignals, frameworks, packageJsonHasLibrarySignals } = params;

  if (hasAiDependencies) {
    return "AI app";
  }

  if (hasCliSignals) {
    return "CLI tool";
  }

  if (frameworks.length > 0) {
    return "Web app";
  }

  if (packageJsonHasLibrarySignals) {
    return "Library";
  }

  return "Web app";
}

export async function analyzeRepository(
  params: AnalyzeRepositoryParams,
): Promise<RepoAnalysisMetadata> {
  const { owner, repo, accessToken, defaultBranch } = params;

  const walkedItems: RepositoryWalkItem[] = [];

  async function walkDirectory(path: string, depth: number): Promise<void> {
    if (depth > MAX_SCAN_DEPTH || walkedItems.length >= MAX_SCAN_FILES) {
      return;
    }

    const items = await fetchContentListing(owner, repo, accessToken, path, defaultBranch);
    const subdirs: string[] = [];

    for (const item of items) {
      if (walkedItems.length >= MAX_SCAN_FILES) {
        break;
      }

      if (item.type !== "file" && item.type !== "dir") {
        continue;
      }

      walkedItems.push({ path: item.path, type: item.type });

      if (item.type === "dir" && shouldDescendDirectory(item.path, depth)) {
        subdirs.push(item.path);
      }
    }

    // Parallel fetches at the next depth level
    await Promise.all(subdirs.map((subdir) => walkDirectory(subdir, depth + 1)));
  }

  await walkDirectory("", 0);

  const filePaths = walkedItems.filter((item) => item.type === "file").map((item) => item.path);
  const directoryPaths = walkedItems
    .filter((item) => item.type === "dir")
    .map((item) => item.path)
    .filter((path) => !path.includes("/"));

  const packageJsonPath = pickClosestToRoot(filePaths, /(^|\/)package\.json$/i);
  const requirementsPath = pickClosestToRoot(filePaths, /(^|\/)requirements\.txt$/i);
  const dockerfilePath = pickClosestToRoot(filePaths, /(^|\/)dockerfile$/i);
  const existingReadmePath = pickClosestToRoot(filePaths, /(^|\/)readme\.md$/i);

  const screenshotPaths = filePaths
    .filter((path) => IMAGE_EXTENSION_PATTERN.test(path))
    .filter((path) => SCREENSHOT_FOLDER_PATTERN.test(path) || /(^|\/)(demo|preview)/i.test(path))
    .slice(0, 8);

  const dependencies = new Set<string>();
  const frameworks = new Set<string>();
  const databasesAndTools = new Set<string>();
  let existingReadmeSummary: string | null = null;
  let packageJsonHasLibrarySignals = false;
  let hasAiDependencies = false;
  let hasCliSignals = false;

  if (packageJsonPath) {
    try {
      const packageJsonContent = await fetchTextFileContent({
        owner,
        repo,
        accessToken,
        path: packageJsonPath,
        ref: defaultBranch,
      });

      if (packageJsonContent) {
        const packageJson = JSON.parse(packageJsonContent) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          peerDependencies?: Record<string, string>;
          optionalDependencies?: Record<string, string>;
          bin?: string | Record<string, string>;
          main?: string;
          exports?: unknown;
          types?: string;
        };

        const packageDependencies = [
          ...Object.keys(packageJson.dependencies ?? {}),
          ...Object.keys(packageJson.devDependencies ?? {}),
          ...Object.keys(packageJson.peerDependencies ?? {}),
          ...Object.keys(packageJson.optionalDependencies ?? {}),
        ].map(normalizeDependencyName);

        for (const dependency of packageDependencies) {
          dependencies.add(dependency);

          const framework = FRAMEWORK_MAP[dependency];
          if (framework) {
            frameworks.add(framework);
          }

          const tool = DATABASE_AND_TOOLS_MAP[dependency];
          if (tool) {
            databasesAndTools.add(tool);
          }

          if (AI_TOOLING.has(dependency)) {
            hasAiDependencies = true;
          }

          if (CLI_TOOLING.has(dependency)) {
            hasCliSignals = true;
          }
        }

        if (typeof packageJson.bin === "string" || typeof packageJson.bin === "object") {
          hasCliSignals = true;
        }

        packageJsonHasLibrarySignals =
          Boolean(packageJson.main || packageJson.types || packageJson.exports) &&
          frameworks.size === 0;
      }
    } catch {
      // Non-fatal: keep analyzer resilient when package manifests are malformed.
    }
  }

  if (requirementsPath) {
    try {
      const requirementsContent = await fetchTextFileContent({
        owner,
        repo,
        accessToken,
        path: requirementsPath,
        ref: defaultBranch,
      });

      if (requirementsContent) {
        const pythonDependencies = parsePythonRequirements(requirementsContent);
        for (const dependency of pythonDependencies) {
          dependencies.add(dependency);

          const framework = FRAMEWORK_MAP[dependency];
          if (framework) {
            frameworks.add(framework);
          }

          const tool = DATABASE_AND_TOOLS_MAP[dependency];
          if (tool) {
            databasesAndTools.add(tool);
          }

          if (AI_TOOLING.has(dependency)) {
            hasAiDependencies = true;
          }

          if (CLI_TOOLING.has(dependency)) {
            hasCliSignals = true;
          }
        }
      }
    } catch {
      // Ignore malformed requirements files to avoid blocking README generation.
    }
  }

  if (dockerfilePath) {
    try {
      const dockerfileContent = await fetchTextFileContent({
        owner,
        repo,
        accessToken,
        path: dockerfilePath,
        ref: defaultBranch,
      });

      if (dockerfileContent) {
        for (const tool of parseDockerfileForTooling(dockerfileContent)) {
          databasesAndTools.add(tool);
        }
      }
    } catch {
      // Dockerfile analysis is additive only.
    }
  }

  if (existingReadmePath) {
    try {
      const readmeContent = await fetchTextFileContent({
        owner,
        repo,
        accessToken,
        path: existingReadmePath,
        ref: defaultBranch,
      });

      if (readmeContent) {
        existingReadmeSummary = summarizeExistingReadme(readmeContent);
      }
    } catch {
      existingReadmeSummary = null;
    }
  }

  if (packageJsonPath) {
    databasesAndTools.add("Node.js");
  }

  if (requirementsPath) {
    databasesAndTools.add("Python");
  }

  const projectType = inferProjectType({
    hasAiDependencies,
    hasCliSignals,
    frameworks: Array.from(frameworks),
    packageJsonHasLibrarySignals,
  });

  const detectedStack = Array.from(
    new Set([...Array.from(frameworks), ...Array.from(databasesAndTools)]),
  ).sort((a, b) => a.localeCompare(b));

  const screenshots = screenshotPaths.map((path) =>
    getRawGitHubUrl(owner, repo, defaultBranch, path),
  );

  return {
    projectType,
    detectedStack,
    dependencies: Array.from(dependencies).sort((a, b) => a.localeCompare(b)).slice(0, 140),
    hasScreenshots: screenshots.length > 0,
    screenshots: screenshots.length ? screenshots : [FALLBACK_PREVIEW_IMAGE],
    frameworks: Array.from(frameworks).sort((a, b) => a.localeCompare(b)),
    databasesAndTools: Array.from(databasesAndTools).sort((a, b) => a.localeCompare(b)),
    existingReadmeSummary,
    topLevelFolders: directoryPaths.sort((a, b) => a.localeCompare(b)),
  };
}
