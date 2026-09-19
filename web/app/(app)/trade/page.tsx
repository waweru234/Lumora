"use client";
import { ASSETS } from "@/lib/assets";
import { useTradeStore } from "@/store/useTradeStore";
import { TradeHero } from "@/components/PublicHero";
import { CandleChart } from "@/components/CandleChart";
import { TradePanel } from "@/components/TradePanel";
import { ActiveTrades } from "@/components/ActiveTrades";
import { useMemo } from "react";
import { aggregateCandles } from "@/lib/market";

const IMAGES = [
  "/gettyimages-1287644807-612x612.jpg",
  "/gettyimages-1334805030-612x612.jpg",
  "/gettyimages-1560536860-612x612.jpg",
  "/gettyimages-2187633207-612x612.jpg",
  "/gettyimages-1503239849-612x612.jpg",
  "/gettyimages-2207359409-612x612.jpg",
];

export default function TradePage() {
  const symbol    = useTradeStore((s) => s.selectedSymbol);
  const setSymbol = useTradeStore((s) => s.setSymbol);
  const series    = useTradeStore((s) => s.series);

  const candles = useMemo(
    () => series?.[symbol] ? aggregateCandles(series[symbol], 60_000) : [],
    [series, symbol],
  );
  const first = candles[Math.max(0, candles.length - 60)];
  const last  = candles[candles.length - 1];
  const change = first && last ? ((last.close - first.open) / first.open) * 100 : 0;

  const idx = ASSETS.findIndex(a => a.symbol === symbol);
  const next = () => setSymbol(ASSETS[(idx + 1) % ASSETS.length].symbol);
  const asset = ASSETS.find(a => a.symbol === symbol)!;

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4 animate-fade-in">
      <TradeHero
        image={IMAGES[idx % IMAGES.length]}
        market={asset.display}
        change={change}
        onChangeMarket={next}
      />

      <div className="rounded-md border border-line bg-bg-900 p-1.5 flex flex-wrap gap-1 animate-fade-up">
        {ASSETS.map(a => (
          <button key={a.symbol} onClick={() => setSymbol(a.symbol)}
            className={`press px-3 py-1.5 rounded text-xs font-mono ${symbol === a.symbol ? "bg-bg-800 text-ink" : "text-muted hover:text-ink"}`}>
            {a.display}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <CandleChart />
          <div className="rounded-md border border-line bg-bg-900 p-4">
            <p className="text-xs uppercase tracking-wider text-muted mb-2">Active trades</p>
            <ActiveTrades />
          </div>
        </div>
        <div className="min-w-0 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <TradePanel />
        </div>
      </div>
    </div>
  );
}
