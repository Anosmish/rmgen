import ReactMarkdown from "react-markdown";

export function ReadmePreview({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-invert prose-headings:font-semibold prose-a:text-cyan-300 prose-code:text-cyan-200 prose-pre:border prose-pre:border-slate-700 prose-pre:bg-slate-950/85 max-w-none rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
