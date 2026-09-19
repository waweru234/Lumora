"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useTradeStore } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { fmtPrice } from "@/lib/format";

const HERO = "/gettyimages-1560536860-612x612.jpg";

export default function MarketsPage() {
  const series = useTradeStore((s) => s.series);
  const symbols = ASSETS.map(a => a.symbol);
  useEffect(() => { symbols.forEach(s => useTradeStore.getState().setSymbol(s)); }, []);

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 animate-fade-in">
      <section className="relative h-32 rounded-md overflow-hidden border border-line hero-overlay animate-fade-up">
        <Image src={HERO} alt="" fill sizes="100vw" priority className="object-cover opacity-30" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted">Section · Markets</p>
            <h1 className="font-display text-3xl font-semibold mt-1">Trade any pair, in one click.</h1>
          </div>
        </div>
      </section>

      <div className="rounded-md border border-line bg-bg-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-800 text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Market</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Change</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Spread</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ASSETS.map((a, i) => {
              const s = series[a.symbol];
              const last = s?.candles?.[s.candles.length - 1]?.close ?? a.basePrice;
              const start = s?.candles?.[0]?.open ?? a.basePrice;
              const change = ((last - start) / start) * 100;
              const up = change >= 0;
              return (
                <tr key={a.symbol} className="animate-fade-up hover:bg-bg-800/40" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted">{a.kind}</p>
                    <p className="font-semibold">{a.display}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmtPrice(last, a.decimals)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${up ? "text-green" : "text-red"} last-line`}>
                    {up ? "▲" : "▼"} {change.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted hidden md:table-cell">{a.spreadBps}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/trade" onClick={() => useTradeStore.getState().setSymbol(a.symbol)}
                          className="press text-green hover:underline">Trade →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
