"use client";
import { useEffect, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { Icon } from "@/components/Icon";

const TOAST_TTL = 4500;

export function Toasts() {
  const notifications = useTradeStore((s) => s.notifications);
  const dismiss       = useTradeStore((s) => s.dismissNotification);
  const markRead      = useTradeStore((s) => s.markNotificationsRead);

  // Show only unread, most-recent first
  const [seen, setSeen] = useState<Set<string>>(new Set());

  // Dismiss on TTL
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const n of notifications.slice(0, 4)) {
      if (seen.has(n.id)) continue;
      setSeen(prev => new Set([...prev, n.id]));
      timers.push(setTimeout(() => dismiss(n.id), TOAST_TTL));
    }
    return () => { for (const t of timers) clearTimeout(t); };
  }, [notifications, seen, dismiss]);

  if (!notifications.length) return null;
  const queue = notifications.slice(0, 4);

  return (
    <div aria-live="polite" className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {queue.map(n => (
        <Toast key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
      ))}
      <button onClick={markRead}
              className="press self-end mt-1 px-2.5 py-1 text-[11px] rounded border border-line bg-bg-900/80 text-muted hover:text-ink pointer-events-auto">
        Mark all read
      </button>
    </div>
  );
}

function Toast({ n, onDismiss }: { n: any; onDismiss: () => void }) {
  const colors: Record<string, string> = {
    Deposit:    "border-green/40 bg-green/10 text-green",
    Trade:      "border-line bg-bg-900 text-ink",
    Result:     "border-line bg-bg-900 text-ink",
    Withdrawal: "border-amber/40 bg-amber/10 text-amber",
    Failed:     "border-red/40 bg-red/10 text-red",
  };
  return (
    <div className={`pointer-events-auto animate-rise rounded-md border px-3 py-2 shadow-2xl w-[280px] sm:w-[320px] ${colors[n.kind] ?? "border-line bg-bg-900 text-ink"}`}>
      <div className="flex items-start gap-2">
        <span className="mt-[2px]"><Icon.Sparkle size={14} /></span>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider opacity-60">{n.kind}</p>
          <p className="text-sm leading-snug">{n.msg}</p>
        </div>
        <button onClick={onDismiss} className="press text-muted hover:text-ink"><Icon.Close size={14} /></button>
      </div>
    </div>
  );
}
