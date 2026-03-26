import { GitHubRepo } from "@/types/github";

import { RepoCard } from "@/components/dashboard/repo-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function RepoList({
  repos,
  selectedRepoFullName,
  loading,
  onSelect,
}: {
  repos: GitHubRepo[];
  selectedRepoFullName: string | null;
  loading: boolean;
  onSelect: (fullName: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-28 w-full" />
        <LoadingSkeleton className="h-28 w-full" />
        <LoadingSkeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!repos.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        No repositories match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repos.map((repo) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          selected={selectedRepoFullName === repo.full_name}
          onSelect={() => onSelect(repo.full_name)}
        />
      ))}
    </div>
  );
}
