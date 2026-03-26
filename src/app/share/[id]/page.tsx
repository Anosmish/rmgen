import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReadmePreview } from "@/components/generator/readme-preview";
import { getSharedReadmeById } from "@/lib/share-store";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const record = getSharedReadmeById(params.id);

  if (!record) {
    return {
      title: "Shared README Not Found",
      description: "This shared README link is invalid or expired.",
    };
  }

  return {
    title: `${record.repoFullName} README`,
    description: `Shared README generated from ${record.repoFullName}`,
  };
}

export default function SharePage({ params }: SharePageProps) {
  const record = getSharedReadmeById(params.id);

  if (!record) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-cyan-300">Shared README</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-100">{record.repoFullName}</h1>
        <p className="mt-2 text-xs text-slate-400">
          Generated template: {record.template} • Shared at {new Date(record.createdAt).toLocaleString()}
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
        >
          Create your own README
        </Link>
      </div>

      <ReadmePreview markdown={record.readme} />
    </section>
  );
}
