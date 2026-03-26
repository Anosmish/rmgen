import ReactMarkdown from "react-markdown";

export function ReadmePreview({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-invert prose-headings:font-semibold prose-a:text-cyan-300 prose-img:rounded-xl prose-img:border prose-img:border-slate-700 prose-img:shadow-lg prose-code:text-cyan-200 prose-pre:border prose-pre:border-slate-700 prose-pre:bg-slate-950/85 prose-table:border prose-th:border prose-td:border prose-th:border-slate-700 prose-td:border-slate-700 max-w-none rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
