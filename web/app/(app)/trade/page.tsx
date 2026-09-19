"use client";
import { useEffect, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { Icon } from "@/components/Icon";
import { CandleChart } from "@/components/CandleChart";
import { ActiveTrades } from "@/components/ActiveTrades";

// This page treats the chart as the primary surface. It deliberately avoids
// the multi-column / hero / row-default layout in favour of:
//
//   ┌── header bar (market • price • duration • amount • UP / DOWN • deposit) ──┐
//   │                                                                              │
//   │                       FULL-VIEWPORT CHART                                    │
//   │                                                                              │
//   └───────────────┬────────────── active trades ribbon ──────────────────────────┘
//
// Trade controls live inline above the chart so the chart can claim every
// remaining pixel of the viewport.

export default function TradePage() {
  const symbol      = useTradeStore((s) => s.selectedSymbol);
  const setSymbol   = useTradeStore((s) => s.setSymbol);
  const timeframe   = useTradeStore((s) => s.timeframe);
  const setTimeframe = useTradeStore((s) => s.setTimeframe);
  const durationMs  = useTradeStore((s) => s.durationMs);
  const setDuration = useTradeStore((s) => s.setDuration);
  const payoutPct   = useTradeStore((s) => s.payoutPct);
  const series      = useTradeStore((s) => s.series[symbol]);
  const placeBet    = useTradeStore((s) => s.placeBet);
  const balance     = useTradeStore((s) => s.balance);
  const realtime    = useTradeStore((s) => s.realtimeBalanceUsdt);
  const lastErr     = useTradeStore((s) => s.lastError);

  useEffect(() => { useTradeStore.getState().setSymbol(symbol); }, [symbol]);

  const asset = ASSETS.find((a) => a.symbol === symbol)!;
  const candles = series?.candles ?? [];
  const last = candles[candles.length - 1];
  const lastPrice = last?.close ?? last?.open ?? asset.basePrice;
  const win = +(Math.max(1, 10) * payoutPct).toFixed(2);

  function place(dir: "HIGH" | "LOW", stakeUsdt: number) {
    placeBet(dir, stakeUsdt);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      <TradeControlBar
        symbol={symbol} setSymbol={setSymbol}
        asset={asset} lastPrice={lastPrice}
        timeframe={timeframe} setTimeframe={setTimeframe}
        durationMs={durationMs} setDuration={setDuration}
        balance={realtime ?? balance}
        place={place} error={lastErr} win={win}
      />

      {/* Chart fills between the control bar and the (collapsible) active trades ribbon */}
      <div className="flex-1 min-h-0 px-2 lg:px-3 mt-2">
        <CandleChart />
      </div>

      <ActiveTradesRibbon />
    </div>
  );
}

function TradeControlBar({
  symbol, setSymbol, asset, lastPrice, timeframe, setTimeframe,
  durationMs, setDuration, balance, place, error, win,
}: {
  symbol: string;
  setSymbol: (s: string) => void;
  asset: typeof ASSETS[number];
  lastPrice: number;
  timeframe: string;
  setTimeframe: (t: any) => void;
  durationMs: number;
  setDuration: (ms: number) => void;
  balance: number;
  place: (dir: "HIGH" | "LOW", stakeUsdt: number) => void;
  error: string | null;
  win: number;
}) {
  const tfList: { label: string; ms: number }[] = [
    { label: "30s", ms: 30_000 },
    { label: "1m",  ms: 60_000 },
    { label: "2m",  ms: 2 * 60_000 },
    { label: "3m",  ms: 3 * 60_000 },
    { label: "5m",  ms: 5 * 60_000 },
    { label: "15m", ms: 15 * 60_000 },
    { label: "30m", ms: 30 * 60_000 },
    { label: "1h",  ms: 60 * 60_000 },
  ];

  function StakeInput() {
    return <TradeStakeInput symbol={symbol} balance={balance} place={place} />;
  }

  return (
    <div className="px-2 lg:px-3 py-3 border-b border-line bg-bg-900/60">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
                className="bg-bg-800 border border-line rounded px-3 py-2 text-sm font-semibold ring-focus">
          {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
        </select>

        <div className="hidden md:flex items-baseline gap-1.5 px-3 py-2 rounded border border-line bg-bg-800/50 min-w-[120px]">
          <span className="text-[10px] uppercase tracking-wider text-muted">Price</span>
          <span className="text-sm font-mono">{fmtNum(lastPrice, asset.decimals)}</span>
        </div>

        {/* timeframe + duration */}
        <div className="flex items-center gap-1 text-xs">
          {tfList.map(tf => (
            <button key={tf.label}
                    onClick={() => { setTimeframe(tf.ms === 60_000 ? "1m" : tf.ms === 5*60_000 ? "5m" : tf.ms === 15*60_000 ? "15m" : tf.ms === 30*60_000 ? "30m" : tf.ms === 60*60_000 ? "1H" : tf.label); setDuration(tf.ms); }}
                    className={`press px-2.5 py-1.5 rounded font-mono border ${durationMs === tf.ms ? "border-green bg-green/10 text-green" : "border-line text-muted hover:text-ink"}`}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* stake — different layout per breakpoint */}
        <div className="order-3 lg:order-none flex items-center gap-1.5">
          <StakeInput />
        </div>

        {/* UP / DOWN */}
        <div className="order-2 lg:order-none flex items-center gap-2 ml-auto">
          <button onClick={() => place("HIGH", 10)}
                  className="press px-4 py-2.5 rounded-lg bg-green text-bg-950 font-semibold inline-flex items-center gap-1.5 hover:bg-green-bright place-flash min-w-[100px] justify-center">
            <Icon.ArrowUp size={14} /> UP
          </button>
          <button onClick={() => place("LOW", 10)}
                  className="press px-4 py-2.5 rounded-lg bg-red text-ink font-semibold inline-flex items-center gap-1.5 hover:bg-red/80 place-flash-red min-w-[100px] justify-center">
            <Icon.ArrowDown size={14} /> DOWN
          </button>
        </div>
      </div>
      <div className="mt-1 text-[11px] text-amber">
        {error || null}
      </div>
    </div>
  );
}

function TradeStakeInput({ symbol, balance, place }: {
  symbol: string;
  balance: number;
  place: (dir: "HIGH" | "LOW", stakeUsdt: number) => void;
}) {
  const [stake, setStake] = useState(10);
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded border border-line bg-bg-800/50">
      <span className="text-xs text-muted">USDT</span>
      <input type="number" min={1} value={stake}
             onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
             className="w-20 bg-transparent text-base font-mono ring-focus outline-none" />
      <span className="text-[11px] text-muted hidden sm:inline">Balance: {balance.toFixed(2)}</span>
      <button onClick={() => place("HIGH", stake)} className="press lg:hidden text-[11px] px-2 py-1 rounded bg-green text-bg-950 font-semibold">UP</button>
      <button onClick={() => place("LOW", stake)}  className="press lg:hidden text-[11px] px-2 py-1 rounded bg-red text-ink font-semibold">DN</button>
    </div>
  );
}

function ActiveTradesRibbon() {
  // Compact, always-visible ribbon (instead of a tucked-away card).
  return (
    <div className="border-t border-line bg-bg-900/60 px-3 py-2 max-h-[180px] overflow-y-auto">
      <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Active trades</p>
      <ActiveTrades />
    </div>
  );
}

function fmtNum(n: number, decimals: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Local useState import — moved to the bottom for readability
