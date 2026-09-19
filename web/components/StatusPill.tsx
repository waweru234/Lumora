export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed:  "bg-green/15 text-green",
    Processing: "bg-amber/15 text-amber",
    Failed:     "bg-red/15 text-red",
    Cancelled:  "bg-bg-800 text-muted",
  };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${map[status] ?? "bg-bg-800 text-muted"}`}>{status}</span>;
}
