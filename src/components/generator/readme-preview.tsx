"use client";

import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export function ReadmePreview({ markdown }: { markdown: string }) {
  const safe =
    typeof window !== "undefined"
      ? DOMPurify.sanitize(markdown, { USE_PROFILES: { html: true } })
      : markdown;

  return (
    <article className="prose prose-invert prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-cyan-300 prose-hr:border-slate-700 prose-p:text-slate-200 prose-strong:text-slate-100 prose-img:rounded-xl prose-img:border prose-img:border-slate-700 prose-img:shadow-lg prose-code:text-cyan-200 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:border prose-pre:border-slate-700 prose-pre:bg-slate-950/85 prose-table:border prose-th:border prose-td:border prose-th:border-slate-700 prose-td:border-slate-700 max-w-none rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {safe}
      </ReactMarkdown>
    </article>
  );
}
