"use client";
import { useMemo } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { aggregateCandles } from "@/lib/market";
import { fmtPrice } from "@/lib/format";

export function MiniChart({ height = 140 }: { height?: number }) {
  const symbol    = useTradeStore((s) => s.selectedSymbol);
  const timeframe = useTradeStore((s) => s.timeframe);
  const series    = useTradeStore((s) => s.series[symbol]);
  const tickPulse = useTradeStore((s) => s.tickPulse);

  const candles = useMemo(
    () => series ? aggregateCandles(series, timeframeMs(timeframe)).slice(-40) : [],
    [series, timeframe],
  );
  const asset = ASSETS.find(a => a.symbol === symbol)!;

  if (!candles.length) {
    return <div className="grid place-items-center text-muted text-xs" style={{ height }}>Chart loading…</div>;
  }

  const W = 600;
  const H = height;
  const PADL = 8, PADR = 56, PADT = 8, PADB = 18;
  const min = Math.min(...candles.map(c => c.low));
  const max = Math.max(...candles.map(c => c.high));
  const range = max - min || asset.spreadBps * 4;
  const yMin = min - range * 0.12;
  const yMax = max + range * 0.12;
  const colW = (W - PADL - PADR) / candles.length;
  const bodyW = Math.max(2, Math.min(8, colW * 0.65));

  const toX = (i: number) => PADL + colW * (i + 0.5);
  const toY = (p: number) => PADT + (1 - (p - yMin) / (yMax - yMin)) * (H - PADT - PADB);

  const last = candles[candles.length - 1];
  const lastY = toY(last.close);
  const lastUp = last.close >= last.open;
  const isLive = last.live ?? false;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
      <rect x={0} y={0} width={W} height={H} fill="#050807" />
      {/* faint grid */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={PADL} x2={W - PADR} y1={PADT + (H - PADT - PADB) * p} y2={PADT + (H - PADT - PADB) * p}
              stroke="#1D2A23" strokeDasharray="2 5" />
      ))}
      {/* candles */}
      {candles.map((c, i) => {
        const x = toX(i);
        const yO = toY(c.open), yC = toY(c.close), yH = toY(c.high), yL = toY(c.low);
        const isUp = c.close >= c.open;
        const color = isUp ? "#22C55E" : "#EF4444";
        const isLast = i === candles.length - 1;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth={0.9} />
            <rect x={x - bodyW / 2} y={Math.min(yO, yC)} width={bodyW}
                  height={Math.max(1, Math.abs(yC - yO))}
                  fill={color} opacity={isLast ? 1 : 0.92} />
            {isLast && (
              <rect x={x - bodyW / 2 - 1} y={Math.min(yO, yC) - 1} width={bodyW + 2}
                    height={Math.max(2, Math.abs(yC - yO)) + 2} fill="none"
                    stroke={color} strokeWidth={isLive ? 1 : 0.6}
                    opacity={isLive ? 0.95 : 0.4} />
            )}
          </g>
        );
      })}
      {/* last price line + label */}
      <line x1={PADL} x2={W - PADR} y1={lastY} y2={lastY} stroke={lastUp ? "#22C55E" : "#EF4444"} strokeDasharray="3 4" />
      <rect x={W - PADR + 2} y={lastY - 8} width={PADR - 4} height={16} rx={2} fill={lastUp ? "#22C55E" : "#EF4444"} />
      <text x={W - PADR + 6} y={lastY + 4} fill="#050807" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight={700}>
        {fmtPrice(last.close, asset.decimals)}
      </text>
      {/* x axis ticks */}
      <text x={PADL + 4} y={H - 6} fill="#8D9A93" fontSize="9" fontFamily="JetBrains Mono, monospace">{candles.length} bars · {timeframe}</text>
    </svg>
  );
  // re-tick pulse to flash live candle border (read of tickPulse triggers the animation)
  void tickPulse;
}

function timeframeMs(tf: string): number {
  switch (tf) {
    case "1m": return 60_000; case "5m": return 5 * 60_000; case "15m": return 15 * 60_000;
    case "30m": return 30 * 60_000; case "1H": return 60 * 60_000; case "4H": return 4 * 60 * 60_000;
    case "1D": return 24 * 60 * 60_000;
    default: return 60_000;
  }
}
