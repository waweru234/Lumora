"use client";
import { useEffect, useRef, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { fmtMs, fmtPrice } from "@/lib/format";
import { ASSETS } from "@/lib/assets";
import { Icon } from "@/components/Icon";

export function ActiveTrades() {
  const positions = useTradeStore((s) => s.positions).filter(p => !p.closed);
  const series    = useTradeStore((s) => s.series);
  const lastTradeId = useTradeStore((s) => s.lastTradeId);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Fade-in flag for the most-recent trade
  const [recentFlash, setRecentFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!lastTradeId) return;
    setRecentFlash(lastTradeId);
    const t = setTimeout(() => setRecentFlash(null), 1400);
    return () => clearTimeout(t);
  }, [lastTradeId]);

  if (!positions.length) {
    return (
      <div className="rounded-md border border-line bg-bg-900 p-4 flex items-center justify-center gap-2 text-sm text-muted">
        <Icon.Trade size={14} />
        No open trades. Pick UP or DOWN to start.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map(p => {
        const asset = ASSETS.find(a => a.symbol === p.symbol)!;
        const remain = Math.max(0, p.expiresAt - now);
        const cur = series[p.symbol]?.candles?.[series[p.symbol].candles.length - 1]?.close ?? p.entryPrice;
        const win = p.direction === "HIGH" ? cur > p.entryPrice : cur < p.entryPrice;
        const isRecent = recentFlash === p.id;
        return (
          <div key={p.id}
               className={`rounded-md border p-3 ${win ? "border-green/40 bg-green/5" : "border-red/40 bg-red/5"} ${isRecent ? "card-in" : ""}`}>
            {isRecent && <div className="h-[2px] -mt-3 mb-2 shimmer rounded" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded ${p.direction === "HIGH" ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                  {p.direction === "HIGH" ? "↑ UP" : "↓ DOWN"}
                </span>
                <span className="font-semibold">{p.symbol}</span>
              </div>
              <div className="font-mono tabular-nums flex items-center gap-1">
                {remain === 0 ? <><span>resolving…</span><span className="text-amber animate-pulse-soft">●</span></> :
                  <>{fmtMs(remain)} <span className="text-muted">left</span></>}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted font-mono flex items-center gap-3 flex-wrap">
              <span>Stake {p.stake.toFixed(2)} USDT</span>
              <span>Entry {fmtPrice(p.entryPrice, asset.decimals)}</span>
              <span>Now {fmtPrice(cur, asset.decimals)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
