import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, WandSparkles } from "lucide-react";

import { SignInButton } from "@/components/auth/sign-in-button";
import { getAuthSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-enter space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            <Sparkles className="size-3.5" />
            Next.js + Groq + GitHub OAuth
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            Generate and ship professional README files in minutes.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Connect your GitHub account, select any repository, generate a structured README with
            AI, preview markdown instantly, and commit directly to your repo.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <SignInButton />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Explore dashboard
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {[
              "GitHub OAuth with NextAuth",
              "Live Markdown preview",
              "One-click README commit",
              "Usage-limited AI generation",
            ].map((pill) => (
              <span key={pill} className="rounded-full border border-slate-700 px-3 py-1">
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="animate-enter rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex items-center gap-2 text-cyan-200">
            <WandSparkles className="size-4" />
            <p className="text-sm font-semibold">How it works</p>
          </div>

          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              1. Sign in with GitHub OAuth (private repos supported).
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              2. Choose a repository and README template.
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              3. Generate, edit, preview, copy, or download README.md.
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              4. Commit README.md directly to GitHub.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
