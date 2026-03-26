import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5">
          <LoadingSkeleton className="h-10 w-64" />
          <LoadingSkeleton className="h-44 w-full" />
          <LoadingSkeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
