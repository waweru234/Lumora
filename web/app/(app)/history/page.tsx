"use client";
import { useTradeStore } from "@/store/useTradeStore";
import { usdt, sign } from "@/lib/money";
import { fmtTime, fmtPrice } from "@/lib/format";
import { ASSETS } from "@/lib/assets";
import { StatusPill } from "@/components/StatusPill";

export default function TradeHistoryPage() {
  const positions    = useTradeStore((s) => s.positions).filter(p => p.closed);
  const transactions = useTradeStore((s) => s.transactions).filter(t => t.kind === "Trade" || t.kind === "Trade result");

  return (
    <div className="px-4 lg:px-6 py-6 max-w-6xl animate-fade-in">
      <h1 className="text-2xl font-semibold">Trade history</h1>
      <p className="text-muted text-sm mt-1">Every trade you opened and the result it produced.</p>

      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        {positions.length === 0 ? (
          <p className="p-8 text-sm text-muted text-center">You haven't completed any trades yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Closed at</th>
                <th className="text-left px-4 py-3">Market</th>
                <th className="text-left px-4 py-3">Direction</th>
                <th className="text-right px-4 py-3">Stake</th>
                <th className="text-right px-4 py-3">Entry</th>
                <th className="text-right px-4 py-3">Exit</th>
                <th className="text-right px-4 py-3">Result</th>
                <th className="text-right px-4 py-3">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {positions.map(p => {
                const asset = ASSETS.find(a => a.symbol === p.symbol)!;
                const tx = transactions.find(t => (t.id as string).includes(p.id.slice(0, 4)));
                return (
                  <tr key={p.id} className="hover:bg-bg-800/40">
                    <td className="px-4 py-3 text-muted">{fmtTime(p.expiresAt)}</td>
                    <td className="px-4 py-3 font-semibold">{p.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${p.direction === "HIGH" ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                        {p.direction === "HIGH" ? "↑ UP" : "↓ DOWN"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{usdt(p.stake)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtPrice(p.entryPrice, asset.decimals)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmtPrice(p.exitPrice ?? p.entryPrice, asset.decimals)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.result === "WIN" ? "text-green" : "text-red"}`}>{p.result}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${(tx?.amountUSDT ?? 0) >= 0 ? "text-green" : "text-red"}`}>
                      {sign(tx?.amountUSDT ?? 0)}{Math.abs(tx?.amountUSDT ?? 0).toFixed(2)} USDT
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
