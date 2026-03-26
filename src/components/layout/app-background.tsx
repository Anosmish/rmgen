export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.2),transparent_42%),radial-gradient(circle_at_82%_16%,rgba(16,185,129,0.16),transparent_38%),linear-gradient(180deg,#020617_0%,#020617_48%,#030712_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
