import { cn } from "@/utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-800/80", className)} />;
}
