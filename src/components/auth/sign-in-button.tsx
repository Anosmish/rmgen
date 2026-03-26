"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

import { cn } from "@/utils/cn";

export function SignInButton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400",
        fullWidth && "w-full",
      )}
    >
      <LogIn className="size-4" />
      Continue with GitHub
    </button>
  );
}
