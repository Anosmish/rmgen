"use client";

import { Layers } from "lucide-react";

import type { TemplatePreset } from "@/types/template-marketplace";

export function TemplateMarketplace({
  presets,
  activePresetId,
  onApplyPreset,
}: {
  presets: TemplatePreset[];
  activePresetId: string | null;
  onApplyPreset: (preset: TemplatePreset) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-slate-100">Template Marketplace</h3>
      </div>
      <p className="text-xs text-slate-400">
        Apply curated presets to improve voice, structure, and conversion quality.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {presets.map((preset) => {
          const active = activePresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                  ? "border-cyan-400/60 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-950/60 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{preset.name}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                  {preset.category}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{preset.summary}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
