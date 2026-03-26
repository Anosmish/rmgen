"use client";

import { Search } from "lucide-react";

import { RepoFilters } from "@/types/github";

export function RepoFiltersPanel({
  filters,
  languages,
  disabled,
  onChange,
}: {
  filters: RepoFilters;
  languages: string[];
  disabled?: boolean;
  onChange: (nextFilters: RepoFilters) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        Search Repository
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.query}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Search by name or description"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Visibility
          </label>
          <select
            value={filters.visibility}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...filters,
                visibility: event.target.value as RepoFilters["visibility"],
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Language
          </label>
          <select
            value={filters.language}
            disabled={disabled}
            onChange={(event) => onChange({ ...filters, language: event.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          >
            <option value="all">All</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
