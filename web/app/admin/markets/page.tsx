import Link from "next/link";
import { ASSETS } from "@/lib/assets";

export default function AdminMarkets() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Markets</h1>
      <p className="text-muted text-sm mt-1">Tradable pairs in the simulator. Live data feeds to be wired from a provider.</p>
      <div className="mt-5 rounded-md border border-line bg-bg-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Symbol</th>
              <th className="text-left px-4 py-3">Display</th>
              <th className="text-left px-4 py-3">Kind</th>
              <th className="text-right px-4 py-3">Volatility</th>
              <th className="text-right px-4 py-3">Decimals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ASSETS.map(a => (
              <tr key={a.symbol}>
                <td className="px-4 py-3 font-mono">{a.symbol}</td>
                <td className="px-4 py-3">{a.display}</td>
                <td className="px-4 py-3 text-muted">{a.kind}</td>
                <td className="px-4 py-3 text-right font-mono">{(a.volatility * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-right font-mono">{a.decimals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
