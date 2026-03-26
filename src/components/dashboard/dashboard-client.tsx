"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitBranch, RefreshCw, Sparkles, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { RepoFiltersPanel } from "@/components/dashboard/repo-filters";
import { RepoList } from "@/components/dashboard/repo-list";
import { ReadmeWorkspace } from "@/components/generator/readme-workspace";
import { TemplateMarketplace } from "@/components/growth/template-marketplace";
import { TEMPLATE_MARKETPLACE_PRESETS } from "@/lib/template-marketplace";
import { GitHubRepo, RepoFilters } from "@/types/github";
import { RepoAnalysisMetadata } from "@/types/repo-analyzer";
import { ReadmeTemplate } from "@/types/readme";
import { TemplatePreset } from "@/types/template-marketplace";
import { downloadTextFile } from "@/utils/download";

const initialFilters: RepoFilters = {
  query: "",
  visibility: "all",
  language: "all",
};

const templateOptions: Array<{ label: string; value: ReadmeTemplate }> = [
  { label: "Default", value: "default" },
  { label: "Startup Product", value: "startup" },
  { label: "AI Project", value: "ai" },
  { label: "Library / SDK", value: "library" },
];

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  image: string;
}

interface ReposApiResponse {
  repos?: GitHubRepo[];
  languages?: string[];
  error?: string;
  rateLimitReset?: string;
}

interface GenerateApiResponse {
  readme?: string;
  remainingGenerations?: number;
  analysis?: RepoAnalysisMetadata;
  analysisWarning?: string;
  error?: string;
}

interface CommitApiResponse {
  action?: "created" | "updated";
  commitUrl?: string | null;
  error?: string;
}

interface ShareApiResponse {
  id?: string;
  shareUrl?: string;
  error?: string;
}

export function DashboardClient({ user }: { user: DashboardUser }) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [filters, setFilters] = useState<RepoFilters>(initialFilters);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string | null>(null);

  const [template, setTemplate] = useState<ReadmeTemplate>("default");
  const [customContext, setCustomContext] = useState("");
  const [readme, setReadme] = useState("");
  const [commitMessage, setCommitMessage] = useState(
    "docs: update README.md with AI GitHub README Generator",
  );
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysisMetadata | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    void loadRepositories();
  }, []);

  useEffect(() => {
    setShareUrl(null);
  }, [selectedRepoFullName]);

  async function loadRepositories() {
    setIsLoadingRepos(true);

    try {
      const response = await fetch("/api/repos", { cache: "no-store" });
      const payload = (await response.json()) as ReposApiResponse;

      if (!response.ok || !payload.repos) {
        const suffix = payload.rateLimitReset
          ? ` Rate limit resets at ${new Date(payload.rateLimitReset).toLocaleTimeString()}.`
          : "";
        throw new Error((payload.error ?? "Failed to load repositories.") + suffix);
      }

      setRepos(payload.repos);
      setLanguages(payload.languages ?? []);

      if (payload.repos.length) {
        setSelectedRepoFullName((prev) => prev ?? payload.repos?.[0]?.full_name ?? null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch repositories.";
      toast.error(message);
    } finally {
      setIsLoadingRepos(false);
    }
  }

  const filteredRepos = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return repos.filter((repo) => {
      const matchesQuery =
        !query ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false);
      const matchesVisibility =
        filters.visibility === "all" || repo.visibility === filters.visibility;
      const matchesLanguage = filters.language === "all" || repo.language === filters.language;

      return matchesQuery && matchesVisibility && matchesLanguage;
    });
  }, [repos, filters]);

  const selectedRepo = useMemo(
    () => repos.find((repo) => repo.full_name === selectedRepoFullName) ?? null,
    [repos, selectedRepoFullName],
  );

  async function handleGenerateReadme() {
    if (!selectedRepo) {
      toast.error("Select a repository first.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          template,
          customContext,
        }),
      });

      const payload = (await response.json()) as GenerateApiResponse;

      if (!response.ok || !payload.readme) {
        throw new Error(payload.error ?? "Failed to generate README.");
      }

      setReadme(payload.readme);
      setRemainingGenerations(payload.remainingGenerations ?? null);
      setAnalysis(payload.analysis ?? null);
      setShareUrl(null);

      if (payload.analysisWarning) {
        toast.warning(payload.analysisWarning);
      }

      toast.success("README generated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "README generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCommitReadme() {
    if (!selectedRepo) {
      toast.error("Select a repository first.");
      return;
    }

    if (!readme.trim()) {
      toast.error("Generate or paste README content before committing.");
      return;
    }

    setIsCommitting(true);

    try {
      const response = await fetch("/api/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          content: readme,
          branch: selectedRepo.default_branch,
          message: commitMessage,
        }),
      });

      const payload = (await response.json()) as CommitApiResponse;

      if (!response.ok || !payload.action) {
        throw new Error(payload.error ?? "Failed to commit README.md to GitHub.");
      }

      toast.success(
        payload.action === "created"
          ? "README.md created and committed."
          : "README.md updated and committed.",
      );

      if (payload.commitUrl) {
        window.open(payload.commitUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Commit failed.");
    } finally {
      setIsCommitting(false);
    }
  }

  async function handleCopyReadme() {
    if (!readme.trim()) {
      toast.error("There is no README content to copy.");
      return;
    }

    await navigator.clipboard.writeText(readme);
    toast.success("README copied to clipboard.");
  }

  function handleDownloadReadme() {
    if (!readme.trim()) {
      toast.error("There is no README content to download.");
      return;
    }

    downloadTextFile("README.md", readme);
    toast.success("README.md download started.");
  }

  function applyTemplatePreset(preset: TemplatePreset) {
    setActivePresetId(preset.id);
    setTemplate(preset.template);
    setCustomContext((previous) => {
      if (!previous.trim()) {
        return preset.contextSeed;
      }

      return `${preset.contextSeed}\n${previous}`;
    });
    toast.success(`Applied template preset: ${preset.name}`);
  }

  async function createShareLink(): Promise<string | null> {
    if (!selectedRepo) {
      toast.error("Select a repository first.");
      return null;
    }

    if (!readme.trim()) {
      toast.error("Generate a README before creating a share link.");
      return null;
    }

    setIsSharing(true);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readme,
          repoFullName: selectedRepo.full_name,
          template,
        }),
      });

      const payload = (await response.json()) as ShareApiResponse;

      if (!response.ok || !payload.shareUrl) {
        throw new Error(payload.error ?? "Failed to create share link.");
      }

      setShareUrl(payload.shareUrl);
      toast.success("Share link created.");
      return payload.shareUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create share link.");
      return null;
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCreateShareLink() {
    await createShareLink();
  }

  async function handleTweetLaunch() {
    if (!selectedRepo) {
      toast.error("Select a repository first.");
      return;
    }

    if (!readme.trim()) {
      toast.error("Generate a README before tweeting.");
      return;
    }

    const resolvedShareUrl = shareUrl ?? (await createShareLink()) ?? selectedRepo.html_url;
    const tweetText = `Just generated a premium README for ${selectedRepo.full_name} using AI.`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(resolvedShareUrl)}&hashtags=${encodeURIComponent("buildinpublic,opensource,github,ai")}`;

    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-100">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Select a repository, generate a production-grade README with Groq, and push directly
            to GitHub in one flow.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRepositories()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
        >
          <RefreshCw className="size-4" />
          Refresh Repositories
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
          <RepoFiltersPanel
            filters={filters}
            languages={languages}
            disabled={isLoadingRepos}
            onChange={setFilters}
          />

          <RepoList
            repos={filteredRepos}
            selectedRepoFullName={selectedRepoFullName}
            loading={isLoadingRepos}
            onSelect={setSelectedRepoFullName}
          />
        </aside>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-100">
                {selectedRepo ? selectedRepo.full_name : "No repository selected"}
              </h2>
              {selectedRepo ? (
                <Link
                  href={selectedRepo.html_url}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  <GitBranch className="size-3.5" />
                  Open on GitHub
                </Link>
              ) : null}
            </div>

            {selectedRepo ? (
              <>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedRepo.description ?? "No description provided."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1">
                    {selectedRepo.language ?? "Unknown language"}
                  </span>
                  <span className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1">
                    {selectedRepo.visibility}
                  </span>
                  <span className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1">
                    default branch: {selectedRepo.default_branch}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Pick a repository from the left panel.</p>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  README Template
                </label>
                <select
                  value={template}
                  onChange={(event) => setTemplate(event.target.value as ReadmeTemplate)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                >
                  {templateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void handleGenerateReadme()}
                  disabled={!selectedRepo || isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <Sparkles className="size-4" />
                  {readme ? "Regenerate with improvements" : "Generate README"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Additional Context (Optional)
              </label>
              <textarea
                value={customContext}
                onChange={(event) => setCustomContext(event.target.value)}
                placeholder="Example: Include Docker-based setup, mention CI workflow, and add API usage examples."
                className="min-h-24 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </div>

            <TemplateMarketplace
              presets={TEMPLATE_MARKETPLACE_PRESETS}
              activePresetId={activePresetId}
              onApplyPreset={applyTemplatePreset}
            />

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Template: {template}</span>
              {remainingGenerations !== null ? (
                <span className="rounded-full border border-slate-700 px-2 py-1 text-cyan-200">
                  Remaining generations today: {remainingGenerations}
                </span>
              ) : null}
            </div>

            {analysis ? (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Auto Repository Analysis
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-cyan-200">
                    {analysis.projectType}
                  </span>
                  {analysis.detectedStack.slice(0, 12).map((stackItem) => (
                    <span
                      key={stackItem}
                      className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1"
                    >
                      {stackItem}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {readme ? (
            <>
              {analysis ? (
                <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">Screenshots Preview</h3>
                    <span className="text-xs text-slate-400">
                      {analysis.hasScreenshots
                        ? "Detected from repository assets"
                        : "Using fallback preview image"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {analysis.screenshots.slice(0, 6).map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80"
                      >
                        <Image
                          src={url}
                          alt={`Screenshot preview ${index + 1}`}
                          width={1024}
                          height={512}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <ReadmeWorkspace
                markdown={readme}
                onMarkdownChange={setReadme}
                onCopy={() => void handleCopyReadme()}
                onDownload={handleDownloadReadme}
                onShare={() => void handleCreateShareLink()}
                onTweet={() => void handleTweetLaunch()}
                isSharing={isSharing}
                shareUrl={shareUrl}
              />

              <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                <h3 className="text-sm font-semibold text-slate-100">Commit README.md to GitHub</h3>
                <input
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="Commit message"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => void handleCommitReadme()}
                  disabled={isCommitting || !selectedRepo || !readme.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <UploadCloud className="size-4" />
                  {isCommitting ? "Committing..." : "Push README to GitHub"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
              Generate a README to start previewing, editing, downloading, and committing.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
