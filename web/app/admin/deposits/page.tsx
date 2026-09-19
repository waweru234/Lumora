"use client";
import { useTradeStore } from "@/store/useTradeStore";
import { fmtTime } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export default function AdminDeposits() {
  const txs = useTradeStore((s) => s.transactions).filter(t => t.kind === "Deposit");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Deposits</h1>
      <p className="text-muted text-sm mt-1">M-Pesa deposit confirmations matched with completed wallet credits.</p>

      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        {txs.length === 0 ? (
          <p className="p-8 text-sm text-muted text-center">No deposits recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Time</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txs.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-mono text-xs">{t.id.slice(0, 14)}…</td>
                  <td className="px-4 py-3">user-demo</td>
                  <td className="px-4 py-3 text-right font-mono text-green">{t.amountUSDT.toFixed(2)} USDT</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{fmtTime(t.at)}</td>
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
