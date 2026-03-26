import { Copy, Download } from "lucide-react";

import { ReadmePreview } from "@/components/generator/readme-preview";

export function ReadmeWorkspace({
  markdown,
  onMarkdownChange,
  onCopy,
  onDownload,
}: {
  markdown: string;
  onMarkdownChange: (next: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">README Workspace</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Editable Markdown
          </p>
          <textarea
            value={markdown}
            onChange={(event) => onMarkdownChange(event.target.value)}
            spellCheck={false}
            className="min-h-[500px] w-full resize-y rounded-xl border border-slate-700 bg-slate-950/75 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Live Preview
          </p>
          <ReadmePreview markdown={markdown} />
        </div>
      </div>
    </div>
  );
}
