import { Globe, Lock, GitFork, Star } from "lucide-react";

import { GitHubRepo } from "@/types/github";
import { cn } from "@/utils/cn";

export function RepoCard({
  repo,
  selected,
  onSelect,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        selected
          ? "border-cyan-400/70 bg-cyan-500/10 shadow-lg shadow-cyan-950/40"
          : "border-slate-800/80 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-100">{repo.full_name}</h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
            repo.private
              ? "bg-amber-400/20 text-amber-200"
              : "bg-emerald-400/20 text-emerald-200",
          )}
        >
          {repo.private ? <Lock className="size-3" /> : <Globe className="size-3" />}
          {repo.private ? "Private" : "Public"}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-400">
        {repo.description ?? "No description provided."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="rounded-md border border-slate-700 px-2 py-1">
          {repo.language ?? "Unknown"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="size-3" />
          {repo.stargazers_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3" />
          {repo.forks_count}
        </span>
      </div>
    </button>
  );
}
