"use client";
import { useTradeStore } from "@/store/useTradeStore";
import { StatusPill } from "@/components/StatusPill";

export default function AdminWithdrawals() {
  const withdrawals = useTradeStore((s) => s.withdrawals);
  const transactions = useTradeStore((s) => s.transactions);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Withdrawal queue</h1>
      <p className="text-muted text-sm mt-1">Review each request, the audit trail and run payment operations.</p>

      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        {withdrawals.length === 0 ? (
          <p className="p-8 text-sm text-muted text-center">Queue is empty.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Request ID</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Requested</th>
                <th className="text-right px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-mono text-xs">{w.id}</td>
                  <td className="px-4 py-3">user-{(w.id.length % 999).toString().padStart(3, "0")}</td>
                  <td className="px-4 py-3">{w.method}{w.phone ? ` · ${w.phone}` : ""}</td>
                  <td className="px-4 py-3 text-right font-mono">{w.amountUSDT.toFixed(2)} USDT</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{new Date(w.requestedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right"><StatusPill status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted mt-4">Every request gets a 24-hour review window. After review, mark it as paid — the user's USDT balance updates and the transaction log is closed.</p>
    </div>
  );
}
