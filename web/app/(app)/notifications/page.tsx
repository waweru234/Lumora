"use client";
import { useTradeStore } from "@/store/useTradeStore";
import { fmtTime } from "@/lib/format";

export default function NotificationsPage() {
  const notifications = useTradeStore((s) => s.notifications);
  const markRead = useTradeStore((s) => s.markNotificationsRead);
  const dismiss = useTradeStore((s) => s.dismissNotification);

  const grouped: Record<string, typeof notifications> = { unread: [], read: [] };
  for (const n of notifications) (n.read ? grouped.read : grouped.unread).push(n);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted text-sm mt-1">Updates on deposits, trades and withdrawals.</p>
        </div>
        {grouped.unread.length > 0 && (
          <button onClick={markRead} className="text-xs text-green hover:underline">Mark all as read</button>
        )}
      </div>

      <Section title="Unread">
        {grouped.unread.length === 0 ? <p className="text-sm text-muted">All caught up.</p> :
          grouped.unread.map(n => <Item key={n.id} n={n} dismiss={dismiss} unread />)}
      </Section>
      <Section title="Earlier">
        {grouped.read.length === 0 ? <p className="text-sm text-muted">No earlier notifications.</p> :
          grouped.read.map(n => <Item key={n.id} n={n} dismiss={dismiss} />)}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <p className="text-xs uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Item({ n, dismiss, unread }: { n: any; dismiss: (id: string) => void; unread?: boolean }) {
  const colors: Record<string, string> = {
    Deposit:    "border-green/40 bg-green/5 text-green",
    Trade:      "border-line bg-bg-800/60",
    Result:     "border-line bg-bg-800/60",
    Withdrawal: "border-amber/40 bg-amber/5 text-amber",
    Failed:     "border-red/40 bg-red/5 text-red",
  };
  return (
    <div className={`rounded-md border p-3 flex items-start gap-3 ${colors[n.kind] ?? "border-line"}`}>
      <div className="flex-1">
        <p className="text-xs uppercase opacity-70">{n.kind}</p>
        <p className={`text-sm mt-0.5 ${unread ? "text-ink" : "text-muted"}`}>{n.msg}</p>
        <p className="text-[11px] text-muted mt-1 font-mono">{fmtTime(n.at)}</p>
      </div>
      <button onClick={() => dismiss(n.id)} className="text-muted hover:text-ink text-xs">Dismiss</button>
    </div>
  );
}
