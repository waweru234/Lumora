"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTradeStore, TIMEFRAMES, type Timeframe } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { aggregateCandles } from "@/lib/market";
import { fmtPrice } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { TradeBar } from "@/components/TradeBar";
import { ActiveTrades } from "@/components/ActiveTrades";

type Tool = "cursor" | "trend" | "horizontal";
type Stroke = { id: string; tool: "trend" | "horizontal"; p1x: number; p1y: number; p2x: number; p2y: number };
type DraftStroke = { tool: "trend" | "horizontal"; p1x: number; p1y: number };

const STROKE_PALETTE = ["#22C55E", "#39FF88", "#F59E0B", "#8D9A93"];

export function CandleChart() {
  const symbol    = useTradeStore((s) => s.selectedSymbol);
  const series    = useTradeStore((s) => s.series[symbol]);
  const timeframe = useTradeStore((s) => s.timeframe);
  const setTf     = useTradeStore((s) => s.setTimeframe);
  const chartType = useTradeStore((s) => s.chartType);
  const setType   = useTradeStore((s) => s.setChartType);

  const candles = useMemo(
    () => (series ? aggregateCandles(series, tfMs(timeframe)) : []),
    [series, timeframe],
  );
  const asset = ASSETS.find(a => a.symbol === symbol)!;

  const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const lastTradeId = useTradeStore((s) => s.lastTradeId);
  const [flashId, setFlashId] = useState<string | null>(null);
  useEffect(() => {
    if (!lastTradeId) return;
    setFlashId(lastTradeId);
    const t = setTimeout(() => setFlashId(null), 1100);
    return () => clearTimeout(t);
  }, [lastTradeId]);

  const tickPulse = useTradeStore((s) => s.tickPulse);
  const [pulseOn, setPulseOn] = useState(false);
  useEffect(() => {
    setPulseOn(true);
    const t = setTimeout(() => setPulseOn(false), 220);
    return () => clearTimeout(t);
  }, [tickPulse]);

  const positions = useTradeStore((s) => s.positions).filter(p => p.symbol === symbol && !p.closed);

  // Drawing tools state
  const [tool, setTool] = useState<Tool>("cursor");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draft, setDraft] = useState<DraftStroke | null>(null);
  const paletteIdx = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!candles.length) {
    return (
      <div className="h-[420px] grid place-items-center text-muted text-sm border border-line rounded-md bg-bg-900">
        Loading market…
      </div>
    );
  }

  const W = 1080;
  const H = fullscreen
    ? (typeof window !== "undefined" ? Math.max(360, Math.round(window.innerHeight * 0.55)) : 720)
    : 420;
  const PRICE_H = Math.round(H * 0.72);
  const VOL_H   = H - PRICE_H - 40;
  const PADL = 12, PADR = 84, PADT = 12, GAP = 10;
  const PRICE_BOT = PADT + PRICE_H;
  const VOL_TOP   = PRICE_BOT + GAP;
  const VOL_BOT   = VOL_TOP + VOL_H;

  const targetCount = timeframe === "1m" ? 80
                   : timeframe === "5m" ? 80
                   : timeframe === "15m" ? 80
                   : timeframe === "30m" ? 80
                   : timeframe === "1H"  ? 96
                   : timeframe === "4H"  ? 60
                   : timeframe === "1D"  ? 90
                   : 80;
  // Show whatever we have — no empty padding. Sparse data is rendered with
  // the candles still using their slot width so the hand-drawn feel works.
  const visible = candles.slice(-Math.min(candles.length, targetCount));
  const min = Math.min(...visible.map(c => c.low),  ...positions.map(p => p.entryPrice));
  const max = Math.max(...visible.map(c => c.high), ...positions.map(p => p.entryPrice));
  const range = max - min || asset.spreadBps * 4;
  const yPad = range * 0.18;
  const yMin = min - yPad, yMax = max + yPad;
  const usableW = W - PADL - PADR;
  const colW = usableW / Math.max(1, visible.length);
  const bodyW = Math.max(2, Math.min(16, colW * 0.7));

  const toX = (i: number) => PADL + colW * (i + 0.5);
  const toY = (p: number) => PADT + (1 - (p - yMin) / (yMax - yMin)) * PRICE_H;

  const last = visible[visible.length - 1];
  const lastY = toY(last.close);
  const lastUp = last.close >= last.open;
  const up = (c: typeof visible[number]) => c.close >= c.open;

  const vMax = Math.max(1, ...visible.map(c => c.volume));
  const toVy = (v: number) => VOL_TOP + VOL_H - (v / vMax) * VOL_H;

  const hoverCandle = hover ? visible[Math.min(visible.length - 1, Math.max(0, hover.idx))] : last;

  function yLabel(v: number) { return fmtPrice(v, asset.decimals); }
  function timeLabel(c: typeof visible[number]) {
    const d = new Date(c.start);
    if (timeframe === "1D" || timeframe === "4H") return d.toLocaleDateString([], { month: "short", day: "numeric" });
    if (timeframe === "1H" || timeframe === "30m") return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const xLabelStride = Math.max(1, Math.round(visible.length / 6));
  const gridLines = 5;

  function svgCoords(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    return { sx: (x / rect.width) * W, sy: (y / rect.height) * H };
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const { sx, sy } = svgCoords(e);
    const idx = Math.min(visible.length - 1, Math.max(0, Math.floor((sx - PADL) / colW)));
    const c = visible[idx];
    setHover({ x: toX(idx), y: toY(c.close), idx });
    if (draft && tool === "trend") setDraft({ ...draft, p1x: draft.p1x, p1y: draft.p1y }); // keep anchor stable
  }

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    if (tool === "cursor") return;
    const { sx, sy } = svgCoords(e);
    if (tool === "horizontal") {
      // Immediate single-click line at this y level across the band.
      const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const color = STROKE_PALETTE[paletteIdx.current % STROKE_PALETTE.length];
      paletteIdx.current += 1;
      setStrokes(prev => [...prev, { id, tool: "horizontal", p1x: PADL, p1y: sy, p2x: W - PADR, p2y: sy }]);
      return;
    }
    if (tool === "trend") {
      if (!draft) {
        setDraft({ tool: "trend", p1x: sx, p1y: sy });
      } else {
        const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const color = STROKE_PALETTE[paletteIdx.current % STROKE_PALETTE.length];
        paletteIdx.current += 1;
        setStrokes(prev => [...prev, { id, tool: "trend", p1x: draft.p1x, p1y: draft.p1y, p2x: sx, p2y: sy }]);
        setDraft(null);
      }
    }
  }

  function clearStrokes() {
    setStrokes([]); setDraft(null); paletteIdx.current = 0;
  }

  const gridY = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: PADT + (PRICE_H * i) / gridLines,
    v: yMax - (i * (yMax - yMin)) / gridLines,
  }));

  const xLabels = visible.map((c, i) => ({ x: toX(i), label: timeLabel(c), show: i % xLabelStride === 0 || i === visible.length - 1 }));
  const linePoints = visible.map((c, i) => `${toX(i)},${toY(c.close)}`).join(" ");
  const areaPath = visible.length > 0
    ? `M ${toX(0)},${VOL_TOP} ` + visible.map((c, i) => `L ${toX(i)},${toY(c.close)}`).join(" ") + ` L ${toX(visible.length - 1)},${VOL_TOP} Z`
    : "";

  const cursorClass = tool === "cursor" ? "cursor-crosshair" : "cursor-crosshair";

  return (
    <>
      <div className={`rounded-md border border-line bg-bg-900 ${fullscreen ? "fixed inset-0 z-50 shadow-2xl flex flex-col bg-bg-950" : ""}`}>
        <ChartHeader
          asset={asset} timeframe={timeframe} setTf={setTf}
          chartType={chartType} setType={setType}
          lastCandle={last} fullscreen={fullscreen} setFullscreen={setFullscreen}
          candlesCount={visible.length} tool={tool} setTool={setTool}
          onClearStrokes={clearStrokes} strokeCount={strokes.length}
        />

        <div className={`relative ${fullscreen ? "flex-1 min-h-0 grid grid-rows-[1fr_auto]" : ""}`}>
          <div className={fullscreen ? "min-h-0 relative" : "relative"}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${VOL_BOT}`}
              preserveAspectRatio="xMidYMid meet"
              className={`block select-none ${fullscreen ? "w-full h-full" : "w-full h-auto"} ${cursorClass}`}
              onMouseMove={onMove}
              onMouseLeave={() => { setHover(null); if (tool === "trend" && !draft) {} }}
              onClick={onClick}
            >
              <defs>
                <linearGradient id="areaUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="areaDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={W} height={VOL_BOT} fill="var(--lumora-bg)" />

              {/* horizontal price grid */}
              {gridY.map(({ y, v }, i) => (
                <g key={`gh-${i}`}>
                  <line x1={PADL} x2={W - PADR} y1={y} y2={y} stroke="var(--lumora-line)" strokeDasharray="2 5" />
                  <text x={W - PADR + 6} y={y + 4} fill="var(--lumora-muted)" fontSize="11" fontFamily="JetBrains Mono, monospace">
                    {yLabel(v)}
                  </text>
                </g>
              ))}

              {xLabels.filter(x => x.show).map((x, i) => (
                <text key={`xl-${i}`} x={x.x} y={VOL_BOT + 4}
                      fill="var(--lumora-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle">
                  {x.label}
                </text>
              ))}

              {/* Volume bars */}
              {visible.map((c, i) => (
                <rect key={`v-${i}`} x={toX(i) - bodyW / 2} y={toVy(c.volume)} width={bodyW} height={VOL_TOP + VOL_H - toVy(c.volume)} fill={up(c) ? "#22C55E" : "#EF4444"} opacity={0.35} />
              ))}

              {positions.map(p => (
                <g key={p.id}>
                  <line
                    x1={PADL} x2={W - PADR} y1={toY(p.entryPrice)} y2={toY(p.entryPrice)}
                    className={flashId === p.id ? "line-flash" : undefined}
                    stroke={p.direction === "HIGH" ? "#22C55E" : "#EF4444"} strokeDasharray="4 4"
                    opacity={flashId === p.id ? 1 : 0.65}
                  />
                  <rect x={PADL + 4} y={toY(p.entryPrice) - 9} width={84} height={18} rx={2} fill={p.direction === "HIGH" ? "#22C55E" : "#EF4444"} />
                  <text x={PADL + 10} y={toY(p.entryPrice) + 4} fill="#050807" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight={700}>
                    {p.direction} {p.entryPrice.toFixed(asset.decimals)}
                  </text>
                </g>
              ))}

              {/* User-drawn strokes */}
              {strokes.map(s => (
                <g key={s.id}>
                  <line x1={s.p1x} x2={s.p2x} y1={s.p1y} y2={s.p2y}
                        stroke={paletteForIdx(paletteIdx.current - strokes.length + strokes.indexOf(s))}
                        strokeWidth={1.4} strokeDasharray={s.tool === "horizontal" ? "0" : "4 3"} />
                  {s.tool === "trend" && (
                    <>
                      <circle cx={s.p1x} cy={s.p1y} r={3} fill="#39FF88" />
                      <circle cx={s.p2x} cy={s.p2y} r={3} fill="#39FF88" />
                    </>
                  )}
                </g>
              ))}
              {draft && tool === "trend" && hover && (
                <line x1={draft.p1x} x2={hover.x} y1={draft.p1y} y2={hover.y}
                      stroke="#39FF88" strokeWidth={1.3} strokeDasharray="3 3" opacity={0.7} />
              )}

              {chartType === "line" ? (
                <>
                  <path d={areaPath} fill={`url(#${lastUp ? "areaUp" : "areaDown"})`} />
                  <polyline fill="none" stroke={lastUp ? "#22C55E" : "#EF4444"} strokeWidth={2} points={linePoints} />
                  {visible.map((c, i) => (
                    <circle key={`lp-${i}`} cx={toX(i)} cy={toY(c.close)} r={i === visible.length - 1 ? 5 : 2} fill={up(c) ? "#22C55E" : "#EF4444"} />
                  ))}
                </>
              ) : (
                visible.map((c, i) => {
                  const x = toX(i);
                  const yO = toY(c.open), yC = toY(c.close), yH = toY(c.high), yL = toY(c.low);
                  const isUp = up(c);
                  const color = isUp ? "#22C55E" : "#EF4444";
                  const isLast = i === visible.length - 1;
                  const liveFlash = isLast && pulseOn && c.live;
                  return (
                    <g key={`c-${i}`}>
                      <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth={1.5} />
                      <rect
                        x={x - bodyW / 2}
                        y={Math.min(yO, yC)}
                        width={bodyW}
                        height={Math.max(1.5, Math.abs(yC - yO))}
                        fill={color}
                        opacity={liveFlash ? 1 : isLast ? 0.95 : 0.92}
                      />
                      {isLast && (
                        <rect
                          x={x - bodyW / 2 - 1}
                          y={Math.min(yO, yC) - 1}
                          width={bodyW + 2}
                          height={Math.max(3, Math.abs(yC - yO)) + 2}
                          fill="none"
                          stroke={color}
                          strokeWidth={liveFlash ? 1.5 : 0.6}
                          opacity={liveFlash ? 0.95 : 0.4}
                        />
                      )}
                    </g>
                  );
                })
              )}

              <line x1={PADL} x2={W - PADR} y1={lastY} y2={lastY} stroke={lastUp ? "#22C55E" : "#EF4444"} strokeDasharray="3 4" />
              <rect x={W - PADR + 2} y={lastY - 11} width={PADR - 6} height={22} rx={3} fill={lastUp ? "#22C55E" : "#EF4444"} />
              <text x={W - PADR + 6} y={lastY + 4} fill="#050807" fontSize="11.5" fontFamily="JetBrains Mono, monospace" fontWeight={700}>
                {yLabel(last.close)}
              </text>

              {hover && (
                <g pointerEvents="none">
                  <line x1={hover.x} x2={hover.x} y1={PADT} y2={VOL_BOT} stroke="var(--lumora-muted)" strokeDasharray="2 3" opacity={0.7} />
                  <line x1={PADL} x2={W - PADR} y1={hover.y} y2={hover.y} stroke="var(--lumora-muted)" strokeDasharray="2 3" opacity={0.7} />
                  <rect x={W - PADR + 2} y={hover.y - 11} width={PADR - 6} height={22} rx={3} fill="var(--lumora-card)" stroke="var(--lumora-line)" />
                  <text x={W - PADR + 6} y={hover.y + 4} fill="var(--lumora-ink)" fontSize="11.5" fontFamily="JetBrains Mono, monospace" fontWeight={700}>
                    {yLabel(hoverCandle.close)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {fullscreen && (
            positions.length > 0 ? (
              <div className="px-2 pb-2 pt-1 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-2 min-h-0">
                <TradeBar compact />
                <div className="rounded-md bg-bg-900 border border-line px-3 py-2 overflow-y-auto max-h-40 md:max-h-full">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Active trades · {positions.length}</p>
                  <ActiveTrades />
                </div>
              </div>
            ) : (
              <div className="px-2 pb-2 pt-1">
                <TradeBar compact />
              </div>
            )
          )}
        </div>

        <div className="hairline" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1 px-3 py-2 text-[11px] font-mono">
          <OhlcCell label="O" value={yLabel(hoverCandle.open)}  color={up(hoverCandle) ? "text-green" : "text-red"} />
          <OhlcCell label="H" value={yLabel(hoverCandle.high)}  color="text-ink" />
          <OhlcCell label="L" value={yLabel(hoverCandle.low)}   color="text-ink" />
          <OhlcCell label="C" value={yLabel(hoverCandle.close)} color={up(hoverCandle) ? "text-green" : "text-red"} />
          <OhlcCell label="Vol" value={hoverCandle.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} color="text-muted" />
        </div>
      </div>

      {fullscreen && (
        <div className="fixed top-3 right-3 z-[60] text-[11px] text-muted bg-bg-900/80 border border-line rounded px-2 py-1">
          Press <kbd className="px-1 bg-bg-700 rounded">Esc</kbd> to exit
        </div>
      )}
    </>
  );
}

function paletteForIdx(i: number) {
  return STROKE_PALETTE[Math.max(0, i) % STROKE_PALETTE.length];
}

function OhlcCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-muted">{label}</span>
      <span className={color}>{value}</span>
    </span>
  );
}

function ChartHeader({ asset, timeframe, setTf, chartType, setType, lastCandle, fullscreen, setFullscreen, candlesCount, tool, setTool, onClearStrokes, strokeCount }: {
  asset: { decimals: number; display: string };
  timeframe: string;
  setTf: (tf: Timeframe) => void;
  chartType: "candle" | "line";
  setType: (t: "candle" | "line") => void;
  lastCandle: { close: number; open: number; live?: boolean };
  fullscreen: boolean;
  setFullscreen: (b: boolean) => void;
  candlesCount: number;
  tool: Tool;
  setTool: (t: Tool) => void;
  onClearStrokes: () => void;
  strokeCount: number;
}) {
  const up = lastCandle.close >= lastCandle.open;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "v" || e.key === "V") setTool("cursor");
      if (e.key === "l" || e.key === "L") setTool("trend");
      if (e.key === "h" || e.key === "H") setTool("horizontal");
    }
    if (fullscreen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [fullscreen, setFullscreen, setTool]);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-line gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs">
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTf(tf)}
              className={`press px-2 py-1 rounded font-mono ${timeframe === tf ? "bg-bg-800 text-ink" : "text-muted hover:text-ink"}`}>
              {tf}
            </button>
          ))}
        </div>
        <div className="mx-2 h-4 w-px bg-line hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1 text-xs">
          {(["candle", "line"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`press px-2 py-1 rounded ${chartType === t ? "bg-bg-800 text-ink" : "text-muted hover:text-ink"}`}>
              {t === "candle" ? "Candles" : "Line"}
            </button>
          ))}
        </div>
        <div className="mx-2 h-4 w-px bg-line hidden md:block" />
        <div className="hidden md:flex items-center gap-1 text-xs">
          <ToolBtn icon={<Icon.ToolCursor    size={14} />} label="Cursor"     shortcut="V" active={tool === "cursor"}     onClick={() => setTool("cursor")} />
          <ToolBtn icon={<Icon.ToolLine      size={14} />} label="Trend"      shortcut="L" active={tool === "trend"}      onClick={() => setTool("trend")} />
          <ToolBtn icon={<Icon.ToolHorizontal size={14} />} label="Horizontal" shortcut="H" active={tool === "horizontal"} onClick={() => setTool("horizontal")} />
          <button onClick={onClearStrokes}
                  className="press px-2 py-1 rounded text-muted hover:text-red inline-flex items-center gap-1"
                  title="Clear drawings">
            <Icon.ToolClear size={12} /> {strokeCount > 0 ? <span>{strokeCount}</span> : null}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-mono ${up ? "text-green" : "text-red"}`}>{asset.display}</span>
        <span className="text-muted hidden sm:inline">·</span>
        <span className="text-muted hidden sm:inline">{lastCandle.live ? "live" : "settled"}</span>
        <span className="text-muted hidden md:inline">{candlesCount} bars</span>
        <button onClick={() => setFullscreen(!fullscreen)}
                className="press px-2 py-1 rounded text-muted hover:text-ink border border-line inline-flex items-center gap-1">
          {fullscreen ? <><Icon.Exit size={12} /> Exit</> : <><Icon.Fullscreen size={12} /> Fullscreen</>}
        </button>
      </div>
    </div>
  );
}

function ToolBtn({ icon, label, shortcut, active, onClick }:
  { icon: React.ReactNode; label: string; shortcut: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
            className={`press px-2 py-1 rounded inline-flex items-center gap-1 ${active ? "bg-bg-800 text-ink" : "text-muted hover:text-ink"}`}
            title={`${label} (${shortcut})`}>
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function tfMs(tf: string): number {
  switch (tf) {
    case "1m":  return 60_000;
    case "5m":  return 5 * 60_000;
    case "15m": return 15 * 60_000;
    case "30m": return 30 * 60_000;
    case "1H":  return 60 * 60_000;
    case "4H":  return 4 * 60 * 60_000;
    case "1D":  return 24 * 60 * 60_000;
    default:    return 60_000;
  }
}
