"use client";
import { useState } from "react";
import { useTradeStore, DURATIONS_MS } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { fmtPrice } from "@/lib/format";
import { Icon } from "@/components/Icon";

// Tiny, dense trade strip that lives at the bottom edge of the trading
// viewport — leaves almost all of the screen for the chart.
export function TradeBar({ compact = false }: { compact?: boolean }) {
  const symbol      = useTradeStore((s) => s.selectedSymbol);
  const setSymbol   = useTradeStore((s) => s.setSymbol);
  const durationMs  = useTradeStore((s) => s.durationMs);
  const setDuration = useTradeStore((s) => s.setDuration);
  const payoutPct   = useTradeStore((s) => s.payoutPct);
  const series      = useTradeStore((s) => s.series[symbol]);
  const placeBet    = useTradeStore((s) => s.placeBet);
  const error       = useTradeStore((s) => s.lastError);

  const [stake, setStake] = useState(10);

  if (!series) return null;

  const asset = ASSETS.find(a => a.symbol === symbol)!;
  const entry = series.candles[series.candles.length - 1]?.close ?? asset.basePrice;
  const win   = +(stake * payoutPct).toFixed(2);

  function place(direction: "HIGH" | "LOW") {
    placeBet(direction, stake);
  }

  if (!compact) {
    // Full-size panel inside the side panel on /trade (non-fullscreen layout)
    return (
      <div className="rounded-md border border-line bg-bg-900 p-5">
        <p className="text-xs text-muted uppercase tracking-[0.2em] mb-3">Place a trade</p>
        <div className="grid grid-cols-1 gap-3 items-stretch">
          <label className="block">
            <span className="text-xs text-muted">Market</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm font-semibold ring-focus">
              {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted">Amount (USDT)</span>
            <div className="mt-1 relative">
              <input type="number" min={1} value={stake}
                onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                className="w-full bg-bg-800 border border-line rounded px-3 py-3 pr-14 text-2xl font-mono ring-focus" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted font-mono">USDT</span>
            </div>
          </label>
          <div>
            <span className="text-xs text-muted">Duration</span>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {DURATIONS_MS.slice(0, 4).map(d => (
                <button key={d.ms} type="button" onClick={() => setDuration(d.ms)}
                  className={`press py-2 text-xs rounded border transition ${durationMs === d.ms ? "border-green bg-green/10 text-green" : "border-line text-muted hover:text-ink hover:border-white/40"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DURATIONS_MS.slice(4).map(d => (
                <button key={d.ms} type="button" onClick={() => setDuration(d.ms)}
                  className={`press py-2 text-xs rounded border transition ${durationMs === d.ms ? "border-green bg-green/10 text-green" : "border-line text-muted hover:text-ink hover:border-white/40"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => place("HIGH")}
              className="press py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright inline-flex items-center justify-center gap-1.5">
              <Icon.ArrowUp size={14} /> UP · {fmtPrice(entry, asset.decimals)}
            </button>
            <button onClick={() => place("LOW")}
              className="press py-2.5 rounded bg-red text-ink font-semibold hover:bg-red/80 inline-flex items-center justify-center gap-1.5">
              <Icon.ArrowDown size={14} /> DOWN · {fmtPrice(entry, asset.decimals)}
            </button>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
        </div>
      </div>
    );
  }

  // Compact (fullscreen bottom strip) — single tight row, dense controls.
  return (
    <div className="rounded-md bg-bg-900/95 border border-line px-2.5 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
          className="bg-bg-800 border border-line rounded px-2 py-1 text-[11px] font-semibold ring-focus max-w-[110px]">
          {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
        </select>

        <div className="hidden sm:flex items-center gap-1 bg-bg-800 border border-line rounded px-2 py-1">
          <span className="text-[10px] uppercase text-muted mr-1">Amt</span>
          <input type="number" min={1} value={stake}
            onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
            className="w-16 bg-transparent text-sm font-mono outline-none" />
          <span className="text-[10px] text-muted">USDT</span>
        </div>

        <input type="number" min={1} value={stake}
               onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
               className="sm:hidden w-16 bg-bg-800 border border-line rounded px-2 py-1 text-[11px] font-mono ring-focus" />

        <select value={durationMs} onChange={(e) => setDuration(Number(e.target.value))}
          className="bg-bg-800 border border-line rounded px-2 py-1 text-[11px] ring-focus max-w-[80px]">
          {DURATIONS_MS.map(d => <option key={d.ms} value={d.ms}>{d.label}</option>)}
        </select>

        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted font-mono px-2">
          <span>Entry <span className="text-ink">{fmtPrice(entry, asset.decimals)}</span></span>
          <span>·</span>
          <span>Payout <span className="text-green">+{win.toFixed(2)}</span></span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => place("HIGH")}
            className="press px-3 py-1.5 rounded bg-green text-bg-950 text-[11px] font-semibold hover:bg-green-bright inline-flex items-center gap-1 place-flash">
            <Icon.ArrowUp size={12} /> UP
          </button>
          <button onClick={() => place("LOW")}
            className="press px-3 py-1.5 rounded bg-red text-ink text-[11px] font-semibold hover:bg-red/80 inline-flex items-center gap-1 place-flash-red">
            <Icon.ArrowDown size={12} /> DOWN
          </button>
        </div>
      </div>

      {error && <p className="text-[10px] text-red mt-1">{error}</p>}
    </div>
  );
}
