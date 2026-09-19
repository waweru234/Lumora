"use client";
import { useState } from "react";
import { useTradeStore, DURATIONS_MS } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { fmtPrice } from "@/lib/format";
import { Icon } from "@/components/Icon";

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
  const [open, setOpen]   = useState(false);

  if (!series) return null;

  const asset = ASSETS.find(a => a.symbol === symbol)!;
  const entry = series.candles[series.candles.length - 1]?.close ?? asset.basePrice;
  const win   = +(stake * payoutPct).toFixed(2);

  function place(direction: "HIGH" | "LOW") {
    const err = placeBet(direction, stake);
    if (!err) setOpen(false);
  }

  return (
    <div className={`rounded-2xl ${compact ? "bg-bg-900/95 border border-line px-3 py-3 backdrop-blur" : "bg-bg-900 border border-line p-5"}`}>
      {!compact && (
        <p className="text-xs text-muted uppercase tracking-[0.2em] mb-3">Place a trade</p>
      )}

      <div className={`grid ${compact ? "grid-cols-12 gap-2" : "grid-cols-1 gap-3"} items-stretch`}>
        <div className={`${compact ? "col-span-5" : "col-span-12"}`}>
          {compact && <p className="text-[10px] text-muted uppercase tracking-wider">Market</p>}
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 w-full bg-bg-800 border border-line rounded px-2.5 py-1.5 text-xs font-semibold ring-focus">
            {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
          </select>
        </div>
        <div className={`${compact ? "col-span-3" : "col-span-12"}`}>
          {compact && <p className="text-[10px] text-muted uppercase tracking-wider">Amount</p>}
          <input type="number" min={1} value={stake}
            onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
            className="mt-1 w-full bg-bg-800 border border-line rounded px-2.5 py-1.5 text-base font-mono ring-focus" />
        </div>
        <div className={`${compact ? "col-span-4" : "col-span-12"}`}>
          {compact && <p className="text-[10px] text-muted uppercase tracking-wider">Duration</p>}
          <select value={durationMs} onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 w-full bg-bg-800 border border-line rounded px-2.5 py-1.5 text-xs ring-focus">
            {DURATIONS_MS.map(d => <option key={d.ms} value={d.ms}>{d.label}</option>)}
          </select>
        </div>

        {!compact && (
          <div className="col-span-12 mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => place("HIGH")}
              className="press py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright inline-flex items-center justify-center gap-1.5">
              <Icon.ArrowUp size={14} /> UP · {fmtPrice(entry, asset.decimals)}
            </button>
            <button onClick={() => place("LOW")}
              className="press py-2.5 rounded bg-red text-ink font-semibold hover:bg-red/80 inline-flex items-center justify-center gap-1.5">
              <Icon.ArrowDown size={14} /> DOWN · {fmtPrice(entry, asset.decimals)}
            </button>
          </div>
        )}

        {error && !compact && <p className="text-xs text-red col-span-12">{error}</p>}
      </div>

      {compact && (
        <>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted font-mono">
            <span>Entry <span className="text-ink">{fmtPrice(entry, asset.decimals)}</span></span>
            <span>·</span>
            <span>Payout <span className="text-green">+{win.toFixed(2)} USDT</span></span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button onClick={() => place("HIGH")}
              className="press py-2 rounded bg-green text-bg-950 text-xs font-semibold hover:bg-green-bright inline-flex items-center justify-center gap-1">
              <Icon.ArrowUp size={12} /> UP
            </button>
            <button onClick={() => place("LOW")}
              className="press py-2 rounded bg-red text-ink text-xs font-semibold hover:bg-red/80 inline-flex items-center justify-center gap-1">
              <Icon.ArrowDown size={12} /> DOWN
            </button>
          </div>
          {error && <p className="text-[10px] text-red mt-1">{error}</p>}
        </>
      )}
    </div>
  );
}
