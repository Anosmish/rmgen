"use client";

import { ExternalLink, Save } from "lucide-react";

interface CodeEditorProps {
  path: string;
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  repoHtmlUrl: string;
}

function getLanguageLabel(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript JSX",
    js: "JavaScript",
    jsx: "JavaScript JSX",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    cs: "C#",
    cpp: "C++",
    c: "C",
    md: "Markdown",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    sh: "Shell",
    bash: "Bash",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sql: "SQL",
    graphql: "GraphQL",
    proto: "Protobuf",
    xml: "XML",
    txt: "Plain Text",
  };
  return map[ext] ?? (ext.toUpperCase() || "Plain Text");
}

export function CodeEditor({
  path,
  content,
  isDirty,
  isSaving,
  onChange,
  onSave,
  repoHtmlUrl,
}: CodeEditorProps) {
  const fileName = path.split("/").pop() ?? path;
  const lang = getLanguageLabel(path);
  const githubFileUrl = `${repoHtmlUrl}/blob/HEAD/${path}`;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      onSave();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.substring(0, start) + "  " + content.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate font-mono text-xs font-medium text-slate-100" title={path}>
            {fileName}
          </span>
          {isDirty && (
            <span className="size-1.5 shrink-0 rounded-full bg-cyan-400" title="Unsaved changes" />
          )}
          <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            {lang}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={githubFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <ExternalLink className="size-3" />
            GitHub
          </a>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Save className="size-3" />
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex overflow-hidden">
          <div className="flex w-10 shrink-0 select-none flex-col items-end overflow-hidden border-r border-slate-800 bg-slate-950/50 py-4 pr-2">
            {content.split("\n").map((_, i) => (
              <span
                key={i}
                className="font-mono text-[11px] leading-5 text-slate-600"
              >
                {i + 1}
              </span>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="flex-1 resize-none bg-transparent py-4 pl-3 pr-4 font-mono text-xs leading-5 text-slate-100 outline-none"
            aria-label={`Edit ${path}`}
          />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 px-4 py-1.5">
        <p className="font-mono text-[10px] text-slate-500">
          {path} · {content.split("\n").length} lines · {content.length} chars
          {isDirty ? " · unsaved" : ""}
        </p>
      </div>
    </div>
  );
}
