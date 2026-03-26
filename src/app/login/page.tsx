import { redirect } from "next/navigation";

import { SignInButton } from "@/components/auth/sign-in-button";
import { getAuthSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <p className="mb-2 text-sm uppercase tracking-[0.22em] text-cyan-300">Welcome</p>
        <h1 className="text-3xl font-semibold text-white">Sign in to your GitHub workspace</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Connect your GitHub account to browse repositories, generate README files with Groq,
          and commit directly to your repo.
        </p>

        <div className="mt-8">
          <SignInButton fullWidth />
        </div>
      </div>
    </section>
  );
}
