"use client";
import Link from "next/link";
import { useTradeStore } from "@/store/useTradeStore";

export default function AdminOverview() {
  const withdrawals  = useTradeStore((s) => s.withdrawals);
  const transactions = useTradeStore((s) => s.transactions);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Total users (live demo)" value="12,420" />
        <Tile label="Active today"            value="1,842" />
        <Tile label="Pending KYC"             value="87" />
        <Tile label="Pending withdrawals"    value={String(withdrawals.filter(w => w.status === "Processing").length)} />
      </div>

      <div className="rounded-md border border-line bg-bg-900 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm">Latest withdrawal queue</p>
          <Link href="/admin/withdrawals" className="text-xs text-green">Open queue</Link>
        </div>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted mt-3">No withdrawals queued in this demo session.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {withdrawals.slice(0, 5).map(w => (
              <li key={w.id} className="py-2 text-sm flex items-center gap-3">
                <span className="font-mono text-xs">{w.id}</span>
                <span className="font-mono">{w.amountUSDT.toFixed(2)} USDT</span>
                <span className="text-muted">via {w.method}</span>
                <span className="ml-auto text-amber">Processing</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-line bg-bg-900 p-5">
        <p className="text-sm">Recent platform activity</p>
        <p className="text-xs text-muted mt-1">Transactions across all simulated accounts.</p>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted mt-3">No activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {transactions.slice(0, 6).map(t => (
              <li key={t.id} className="py-2 flex items-center gap-3">
                <span className="text-muted w-40 text-xs">{new Date(t.at).toLocaleString()}</span>
                <span>{t.kind}</span>
                <span className="ml-auto font-mono">{t.amountUSDT.toFixed(2)} USDT</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-bg-900 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-mono">{value}</p>
    </div>
  );
}
