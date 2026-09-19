"use client";
import { useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { fmtTime } from "@/lib/format";
import { sign } from "@/lib/money";
import { StatusPill } from "@/components/StatusPill";

const FILTERS = ["All", "Deposits", "Trades", "Withdrawals"] as const;

export default function TransactionsPage() {
  const transactions = useTradeStore((s) => s.transactions);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");

  const visible = transactions.filter(t => {
    if (filter === "All") return true;
    if (filter === "Deposits") return t.kind === "Deposit";
    if (filter === "Withdrawals") return t.kind === "Withdraw";
    return t.kind === "Trade" || t.kind === "Trade result";
  });

  return (
    <div className="px-4 lg:px-6 py-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <p className="text-muted text-sm mt-1">Every deposit, trade and withdrawal on your account.</p>

      <div className="mt-4 flex gap-1 text-sm">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded border ${filter === f ? "border-green bg-green/10 text-green" : "border-line text-muted hover:text-ink"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-8 text-sm text-muted text-center">Nothing here yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Detail</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map(t => (
                <tr key={t.id} className="hover:bg-bg-800/40">
                  <td className="px-4 py-3 text-muted">{new Date(t.at).toLocaleDateString()} <span className="text-xs">{fmtTime(t.at)}</span></td>
                  <td className="px-4 py-3">{t.kind}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted">{t.symbol !== "USDT" && t.symbol !== "M-Pesa" && t.symbol !== "Bank" ? t.symbol : "—"}</td>
                  <td className={`px-4 py-3 text-right font-mono ${t.amountUSDT >= 0 ? "text-green" : "text-red"}`}>
                    {sign(t.amountUSDT)}{Math.abs(t.amountUSDT).toFixed(2)} USDT
                  </td>
                  <td className="px-4 py-3 text-right"><StatusPill status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
