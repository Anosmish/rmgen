import { Copy, Download, ExternalLink, Share2 } from "lucide-react";

import { ReadmePreview } from "@/components/generator/readme-preview";

export function ReadmeWorkspace({
  markdown,
  onMarkdownChange,
  onCopy,
  onDownload,
  onShare,
  onTweet,
  isSharing,
  shareUrl,
}: {
  markdown: string;
  onMarkdownChange: (next: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  onShare: () => void;
  onTweet: () => void;
  isSharing: boolean;
  shareUrl: string | null;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">README Workspace</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Download className="size-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={isSharing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Share2 className="size-3.5" />
            {isSharing ? "Creating..." : "Create Share Link"}
          </button>
          <button
            type="button"
            onClick={onTweet}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <ExternalLink className="size-3.5" />
            Tweet Launch
          </button>
        </div>
      </div>

      {shareUrl ? (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Shareable Link
          </p>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-cyan-100 underline decoration-cyan-300/50 underline-offset-4"
          >
            {shareUrl}
          </a>
        </div>
      ) : null}

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
