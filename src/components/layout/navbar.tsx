"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Boxes, LogOut } from "lucide-react";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="rounded-md bg-cyan-500/20 p-1 text-cyan-300 transition group-hover:bg-cyan-500/30">
            <Boxes className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-slate-100 sm:text-base">
            AI GitHub README Generator
          </span>
        </Link>

        {status === "loading" ? (
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-8 w-8 rounded-full" />
            <LoadingSkeleton className="h-8 w-24 rounded-lg" />
          </div>
        ) : session?.user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-full border border-slate-800/80 bg-slate-900/70 px-2 py-1 sm:flex">
              <Image
                src={session.user.image ?? "/avatar-fallback.svg"}
                width={28}
                height={28}
                alt={session.user.name ?? "User avatar"}
                className="size-7 rounded-full"
              />
              <p className="pr-2 text-sm text-slate-200">{session.user.name ?? "GitHub User"}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/85 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-rose-500/70 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Boxes className="size-4" />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
