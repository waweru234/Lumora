"use client";
import { useEffect, useRef, useState } from "react";
import { useTradeStore, DURATIONS_MS, type Direction } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { fmtPrice } from "@/lib/format";
import { Icon } from "@/components/Icon";

type Draft = {
  symbol: string;
  direction: Direction;
  stake: number;
  entryPrice: number;
};

export function TradePanel() {
  const symbol      = useTradeStore((s) => s.selectedSymbol);
  const setSymbol   = useTradeStore((s) => s.setSymbol);
  const durationMs  = useTradeStore((s) => s.durationMs);
  const setDuration = useTradeStore((s) => s.setDuration);
  const payoutPct   = useTradeStore((s) => s.payoutPct);
  const setPayoutPct= useTradeStore((s) => s.setPayoutPct);
  const balance     = useTradeStore((s) => s.balance);
  const placeBet    = useTradeStore((s) => s.placeBet);
  const lastError   = useTradeStore((s) => s.lastError);
  const series      = useTradeStore((s) => s.series[symbol]);

  useEffect(() => { useTradeStore.getState().setSymbol(symbol); }, [symbol]);

  const [stake, setStake] = useState(10);
  const [pending, setPending] = useState<Draft | null>(null);

  if (!series) return (
    <div className="rounded-md border border-line bg-bg-900 p-5 text-sm text-muted">Loading market…</div>
  );

  const asset = ASSETS.find(a => a.symbol === symbol)!;
  const entry = series.candles[series.candles.length - 1]?.close ?? asset.basePrice;
  const win   = +(stake * payoutPct).toFixed(2);

  function startTrade(direction: Direction) {
    setPending({ symbol, direction, stake, entryPrice: entry });
  }
  function confirm() {
    if (!pending) return;
    const err = placeBet(pending.direction, pending.stake);
    if (!err) setPending(null);
  }

  const presets = [5, 10, 25, 50, 100];

  return (
    <div className="rounded-md border border-line bg-bg-900 p-4 lg:p-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-[0.2em] mb-3">Place a trade</p>

        <label className="block">
          <span className="text-xs text-muted">Market</span>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus">
            {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
          </select>
        </label>

        <label className="block mt-3">
          <span className="text-xs text-muted flex items-center justify-between">
            <span>Amount</span>
            <span className="font-mono text-ink">USDT</span>
          </span>
          <div className="mt-1 relative">
            <input
              type="number" min={1} value={stake}
              onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
              className="w-full bg-bg-800 border border-line rounded px-3 py-3 pr-14 text-2xl font-mono ring-focus placeholder:text-muted"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted font-mono">USDT</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {presets.map(p => (
              <button key={p} onClick={() => setStake(p)} type="button"
                className="press px-2 py-1 rounded bg-bg-800 border border-line text-xs hover:border-green-bright">
                {p}
              </button>
            ))}
            <button onClick={() => setStake(Math.max(1, Math.floor(balance / 2)))} type="button"
              className="press px-2 py-1 rounded bg-bg-800 border border-line text-xs hover:border-green-bright">
              half
            </button>
            <button onClick={() => setStake(Math.max(1, Math.floor(balance)))} type="button"
              className="press px-2 py-1 rounded bg-bg-800 border border-line text-xs hover:border-green-bright">
              all-in
            </button>
          </div>
        </label>

        <div className="mt-4">
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <UpDownButton kind="UP"  onClick={() => startTrade("HIGH")} />
          <UpDownButton kind="DOWN" onClick={() => startTrade("LOW")} />
        </div>

        {lastError && <p className="mt-3 text-xs text-red">{lastError}</p>}
      </div>

      {pending && (
        <ConfirmModal
          draft={pending}
          asset={asset}
          payoutPct={payoutPct}
          setPayoutPct={setPayoutPct}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function UpDownButton({ kind, onClick }: { kind: "UP" | "DOWN"; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const up = kind === "UP";
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`press py-3 rounded-lg font-semibold flex items-center justify-center gap-2 relative overflow-hidden
                  ${up ? "bg-green text-bg-950 hover:bg-green-bright" : "bg-red text-ink hover:bg-red/80"}
                  place-flash-${up ? "" : "red"}`}
    >
      <span aria-hidden>{up ? <Icon.ArrowUp size={16} /> : <Icon.ArrowDown size={16} />}</span>
      <span className="font-display tracking-wider">{kind}</span>
      <span aria-hidden className="absolute inset-0 shimmer opacity-60 pointer-events-none" />
    </button>
  );
}

function ConfirmModal({ draft, asset, payoutPct, setPayoutPct, onConfirm, onCancel }: {
  draft: Draft; asset: typeof ASSETS[number]; payoutPct: number; setPayoutPct: (n: number) => void;
  onConfirm: () => void; onCancel: () => void;
}) {
  const win = +(draft.stake * payoutPct).toFixed(2);
  const up  = draft.direction === "HIGH";

  return (
    <div className="fixed inset-0 z-50 bg-bg-950/80 backdrop-blur-sm grid place-items-center p-4">
      <div className="modal-in w-full max-w-sm rounded-md border border-line bg-bg-900 p-5 shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Confirm your trade</p>
        <div className="mt-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold font-display">{draft.symbol}</h3>
          <span className={`text-base font-semibold ${up ? "text-green" : "text-red"}`}>{up ? "↑ UP" : "↓ DOWN"}</span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Amount" value={<span className="font-mono">{draft.stake.toFixed(2)} USDT</span>} />
          <Row label="Entry"  value={<span className="font-mono">{fmtPrice(draft.entryPrice, asset.decimals)}</span>} />
          <Row label="Payout on win" value={<span className="font-mono text-green">+{win.toFixed(2)} USDT</span>} />
          <div className="flex items-center gap-2 pt-1">
            <input type="range" min={0.6} max={0.95} step={0.01} value={payoutPct}
              onChange={(e) => setPayoutPct(Number(e.target.value))} className="flex-1 accent-green" />
            <span className="text-xs text-muted tabular-nums">{Math.round(payoutPct * 100)}%</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onCancel} type="button"
            className="press py-2.5 rounded border border-line text-muted hover:text-ink">Cancel</button>
          <button onClick={onConfirm} type="button"
            className="press py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
