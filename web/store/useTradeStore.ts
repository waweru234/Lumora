"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ASSETS, type Asset } from "@/lib/assets";
import type { Direction } from "@/lib/assets";
import { initSeries, nextTick, rollCandle, type CandleSeries } from "@/lib/market";
import { payoutOnWin, round2, stakeValid } from "@/lib/payout";
import { shortId } from "@/lib/format";

export type Position = {
  id: string;
  symbol: string;
  direction: Direction;
  stake: number;
  entryPrice: number;
  expiresAt: number;
  placedAt: number;
  closed?: boolean;
  result?: "WIN" | "LOSS";
  exitPrice?: number;
  payout?: number;
  balanceAfter?: number;
};

export type TransactionStatus = "Completed" | "Processing" | "Failed" | "Cancelled";

export type TransactionRow = {
  id: string;
  kind: "Deposit" | "Withdraw" | "Trade" | "Trade result";
  symbol: string;
  amountUSDT: number;     // signed: + credit, - debit
  status: TransactionStatus;
  at: number;
};

export type Withdrawal = {
  id: string;
  amountUSDT: number;
  method: "M-Pesa" | "Bank";
  phone?: string;
  status: TransactionStatus;
  requestedAt: number;
  etaHours: number;
};

export type Notification = {
  id: string;
  kind: "Deposit" | "Trade" | "Result" | "Withdrawal" | "Failed";
  msg: string;
  at: number;
  read: boolean;
};

export type User = {
  name: string;
  email: string;
  phone: string;
  kyc: "Unverified" | "Pending" | "Verified";
  joinedAt: number;
};

export const DURATIONS_MS = [
  { label: "30s", ms: 30_000 },
  { label: "1m",  ms: 60_000 },
  { label: "2m",  ms: 2 * 60_000 },
  { label: "3m",  ms: 3 * 60_000 },
  { label: "5m",  ms: 5 * 60_000 },
  { label: "30m", ms: 30 * 60_000 },
  { label: "1h",  ms: 60 * 60_000 },
];

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"] as const;
export type Timeframe = typeof TIMEFRAMES[number];

export type { Direction } from "@/lib/assets";

type State = {
  user: User | null;
  mode: "guest" | "real";
  realtimeBalanceUsdt: number | null;
  kesPerUsdt: number;

  balance: number;
  pendingBalance: number;
  payoutPct: number;
  selectedSymbol: string;
  durationMs: number;
  timeframe: Timeframe;
  chartType: "candle" | "line";
  series: Record<string, CandleSeries>;
  tickPulse: number;       // increments every tick — used to flash the live candle
  sidebarCollapsed: boolean;
  lastTradeId: string | null;

  positions: Position[];
  transactions: TransactionRow[];
  withdrawals: Withdrawal[];
  notifications: Notification[];
  lastError: string | null;

  tickAll: () => void;
  setSymbol: (sym: string) => void;
  setDuration: (ms: number) => void;
  setTimeframe: (tf: Timeframe) => void;
  setChartType: (t: "candle" | "line") => void;
  setPayoutPct: (pct: number) => void;

  placeBet: (direction: Direction, stake: number) => string | null;
  resolveDue: () => void;

  login: (name: string, email: string) => void;
  logout: () => void;

  requestDeposit: (amountUSDT: number, ref: string) => void;
  confirmDeposit: (ref: string, amountUSDT: number, mode?: "server" | "local") => void;
  failDeposit: (ref: string) => void;
  requestWithdrawal: (amountUSDT: number, method: "M-Pesa" | "Bank", phone?: string) => Promise<string | null>;
  tickWithdrawals: () => void;
  markNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (b: boolean) => void;

  setMode: (m: "guest" | "real") => void;
  applyRealtimeBalance: (n: number) => void;
  expirePendingDeposits: () => void;

  resetDemo: () => void;
};

function ensureSeries(state: State, symbol: string): CandleSeries {
  const existing = state.series[symbol];
  if (existing) return existing;
  const asset = ASSETS.find((a) => a.symbol === symbol) as Asset;
  const seeded: Record<string, CandleSeries> = { ...state.series, [symbol]: initSeries(asset) };
  return seeded[symbol];
}

function notify(s: State, kind: Notification["kind"], msg: string): Notification[] {
  const n: Notification = { id: shortId(), kind, msg, at: Date.now(), read: false };
  return [n, ...s.notifications].slice(0, 30);
}

export const useTradeStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      mode: "guest",
      realtimeBalanceUsdt: null,
      kesPerUsdt: 129.5,

      balance: 1000,
      pendingBalance: 0,
      payoutPct: 0.85,
      selectedSymbol: "EURUSD",
      durationMs: 60_000,           // 1 min default
      timeframe: "1m",
      chartType: "candle",
      series: {},
      tickPulse: 0,
      sidebarCollapsed: false,
      lastTradeId: null,

      positions: [],
      transactions: [],
      withdrawals: [],
      notifications: [],
      lastError: null,

      tickAll: () => {
        const { series, selectedSymbol } = get();
        const keys = Object.keys(series);
        const symbols = keys.length ? keys : ASSETS.map(a => a.symbol);
        const next: Record<string, CandleSeries> = {};
        for (const sym of symbols) {
          const asset = ASSETS.find((a) => a.symbol === sym) as Asset | undefined;
          if (!asset) continue;
          let s = series[sym];
          // Seed on demand so the very first AppShell tick doesn't crash on
          // an empty store, and so we heal an older persisted state where
          // extended[] was missing.
          if (!s || !s.candles?.length || !s.extended?.length) s = initSeries(asset);
          s = nextTick(s, asset);
          s = rollCandle(s, asset);
          next[sym] = s;
        }
        set({ series: { ...series, ...next }, tickPulse: get().tickPulse + 1 });
        get().resolveDue();
      },

      setSymbol: (sym) => {
        const cur = get();
        if (cur.selectedSymbol === sym && cur.series[sym]) return;
        const s = ensureSeries(cur, sym);
        set({ selectedSymbol: sym, series: { ...cur.series, [sym]: s } });
      },
      setDuration: (ms) => set({ durationMs: ms }),
      setTimeframe: (tf) => set({ timeframe: tf }),
      setChartType: (t) => set({ chartType: t }),
      setPayoutPct: (pct) => set({ payoutPct: pct }),

      placeBet: (direction, stake) => {
        const { balance, selectedSymbol, durationMs, payoutPct, positions } = get();
        const valid = stakeValid(stake, balance);
        if (valid) {
          set({ lastError: valid });
          return valid;
        }
        const s = ensureSeries(get(), selectedSymbol);
        const entryPrice = s.candles[s.candles.length - 1].close;
        const id = shortId();
        const pos: Position = {
          id, symbol: selectedSymbol, direction, stake,
          entryPrice, expiresAt: Date.now() + durationMs,
          placedAt: Date.now(),
        };
        set({
          balance: round2(balance - stake),
          positions: [...positions, pos],
          series: { ...get().series, [selectedSymbol]: s },
          lastError: null,
          lastTradeId: id,
          notifications: notify(get(), "Trade", `${selectedSymbol} · ${direction === "HIGH" ? "UP" : "DOWN"} · ${stake.toFixed(2)} USDT`),
          transactions: [
            { id: `t-${id}`, kind: "Trade", symbol: selectedSymbol, amountUSDT: -stake, status: "Completed", at: Date.now() } as TransactionRow,
            ...get().transactions,
          ].slice(0, 200),
        });
        return null;
      },

      resolveDue: () => {
        const now = Date.now();
        const { positions, series, balance, transactions } = get();
        if (!positions.length) return;
        let newBalance = balance;
        const updated: Position[] = [];
        const resolvedTxs: TransactionRow[] = [];
        const noteBatch: Notification[] = [];
        for (const p of positions) {
          if (!p.closed && p.expiresAt <= now) {
            const sym = p.symbol;
            const cur = series[sym]?.candles?.[series[sym].candles.length - 1];
            const exit = cur?.close ?? p.entryPrice;
            const win = p.direction === "HIGH" ? exit > p.entryPrice : exit < p.entryPrice;
            const payout = win ? payoutOnWin(p.stake, get().payoutPct) : 0;
            const credit = win ? round2(p.stake + payout) : 0;
            newBalance = round2(newBalance + credit);
            updated.push({ ...p, closed: true, exitPrice: exit, result: win ? "WIN" : "LOSS", payout, balanceAfter: newBalance });
            resolvedTxs.push({
              id: `r-${p.id}-${now}`, kind: "Trade result", symbol: p.symbol,
              amountUSDT: credit, status: "Completed", at: now,
            });
            noteBatch.push(
              win
                ? { id: shortId(), kind: "Result", msg: `Trade completed. Won ${credit.toFixed(2)} USDT on ${p.symbol}.`, at: now, read: false }
                : { id: shortId(), kind: "Result", msg: `Trade completed. Lost ${p.stake.toFixed(2)} USDT on ${p.symbol}.`, at: now, read: false },
            );
          } else {
            updated.push(p);
          }
        }
        if (!resolvedTxs.length) return;
        set({
          positions: updated,
          transactions: [...resolvedTxs, ...transactions].slice(0, 200),
          balance: newBalance,
          notifications: [...noteBatch, ...get().notifications].slice(0, 30),
        });
      },

      login: (name, email) => {
        const u: User = {
          name: name || email.split("@")[0] || "Trader",
          email,
          phone: "",
          kyc: "Unverified",
          joinedAt: Date.now(),
        };
        set({ user: u });
      },
      logout: () => set({ user: null }),

      requestDeposit: (amountUSDT, ref) => {
        // Records a "Processing" intent locally. The actual credit happens
        // ONLY after /api/deposits/confirm returns ResultCode=0.
        const row: TransactionRow = {
          id: ref, kind: "Deposit", symbol: "USDT",
          amountUSDT: amountUSDT, status: "Processing", at: Date.now(),
        };
        set({
          pendingBalance: round2(get().pendingBalance + amountUSDT),
          transactions: [row, ...get().transactions].slice(0, 200),
          notifications: notify(get(), "Deposit", `Deposit request opened for ${amountUSDT.toFixed(2)} USDT. Waiting for M-Pesa confirmation…`),
        });
      },

      confirmDeposit: (ref, amountUSDT, mode = "server") => {
        const s = get();
        if (!s.transactions.find(t => t.id === ref && t.status === "Processing")) return;
        set({
          balance: round2(s.balance + amountUSDT),
          pendingBalance: round2(Math.max(0, s.pendingBalance - amountUSDT)),
          transactions: s.transactions.map(t => t.id === ref ? { ...t, status: "Completed" as const, amountUSDT } : t),
          notifications: notify(s, mode === "server" ? "Deposit" : "Deposit",
            `Deposit of ${amountUSDT.toFixed(2)} USDT confirmed by M-Pesa.`),
        });
      },

      failDeposit: (ref) => {
        const s = get();
        if (!s.transactions.find(t => t.id === ref && t.status === "Processing")) return;
        const row = s.transactions.find(t => t.id === ref);
        const amt = row?.amountUSDT ?? 0;
        set({
          pendingBalance: round2(Math.max(0, s.pendingBalance - amt)),
          transactions: s.transactions.map(t => t.id === ref ? { ...t, status: "Failed" as const } : t),
          notifications: notify(s, "Failed", `Deposit declined. ${amt.toFixed(2)} USDT was not added to your balance.`),
        });
      },

      requestWithdrawal: async (amountUSDT, method, phone) => {
        const valid = stakeValid(amountUSDT, get().balance);
        if (valid) return valid;
        const id = `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const w: Withdrawal = {
          id, amountUSDT, method, phone,
          status: "Processing", requestedAt: Date.now(), etaHours: 24,
        };
        // Optimistic local update so the UI reacts instantly.
        set({
          balance: round2(get().balance - amountUSDT),
          withdrawals: [w, ...get().withdrawals].slice(0, 100),
          transactions: [
            { id: w.id, kind: "Withdraw", symbol: method === "M-Pesa" ? "M-Pesa" : "Bank", amountUSDT: -amountUSDT, status: "Processing", at: Date.now() } as TransactionRow,
            ...get().transactions,
          ].slice(0, 200),
          notifications: notify(get(), "Withdrawal", `Withdrawal request received. ${amountUSDT.toFixed(2)} USDT. Please allow up to 24 hours.`),
        });
        // Persist to Supabase if signed in.
        try {
          const tok = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
          if (tok) {
            const res = await fetch("/api/withdrawals", {
              method: "POST",
              headers: { "content-type": "application/json", authorization: `Bearer ${tok}` },
              body: JSON.stringify({ amount_usdt: amountUSDT, method, phone: phone ?? null }),
            });
            if (res.ok) {
              const j = await res.json();
              if (j.ok && j.withdrawal?.id) {
                useTradeStore.setState(s => ({
                  withdrawals: s.withdrawals.map(wl => wl.id === id ? { ...wl, id: j.withdrawal.id } : wl),
                  transactions: s.transactions.map(t => t.id === id ? { ...t, id: j.withdrawal.id } : t),
                }));
              }
            }
          }
        } catch { /* keep optimistic row regardless */ }
        return null;
      },

      tickWithdrawals: () => {
        const now = Date.now();
        const updated = get().withdrawals.map(w => {
          if (w.status !== "Processing") return w;
          const ageH = (now - w.requestedAt) / (1000 * 60 * 60);
          if (ageH >= w.etaHours) {
            return { ...w, status: "Completed" as TransactionStatus };
          }
          return w;
        });
        const completedNow = updated.filter(w => w.status === "Completed" && get().withdrawals.find(x => x.id === w.id && x.status !== "Completed"));
        if (completedNow.length) {
          set({
            withdrawals: updated.map(w => ({
              ...w,
              status: w.status === "Completed" ? "Completed" : w.status,
              _announced: false,
            } as Withdrawal & { _announced?: boolean })),
          });
        } else {
          set({ withdrawals: updated });
        }
      },

      markNotificationsRead: () => set({
        notifications: get().notifications.map(n => ({ ...n, read: true })),
      }),
      dismissNotification: (id) => set({
        notifications: get().notifications.filter(n => n.id !== id),
      }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (b) => set({ sidebarCollapsed: b }),
  setMode: (m) => set({ mode: m }),
  applyRealtimeBalance: (n) => set({ realtimeBalanceUsdt: n, balance: n }),

  // Cron: any deposit that has been "Processing" for more than 60s and hasn't
  // been confirmed by /api/deposits/confirm turns into Failed — money NEVER
  // counts as received, and a notification is raised.
  expirePendingDeposits: () => {
    const s = get();
    const now = Date.now();
    const TIMEOUT_MS = 60_000;
    const stale = s.transactions.find(t => t.kind === "Deposit" && t.status === "Processing" && (now - t.at) > TIMEOUT_MS);
    if (!stale) return;
    const amt = stale.amountUSDT;
    set({
      pendingBalance: round2(Math.max(0, s.pendingBalance - amt)),
      transactions: s.transactions.map(t => t.id === stale.id ? { ...t, status: "Failed" as const } : t),
      notifications: notify(s, "Failed", `Deposit of ${amt.toFixed(2)} USDT expired (no M-Pesa confirmation after 60s). Money was not added to your balance.`),
    });
  },

      resetDemo: () => set({
        user: get().user,
        balance: 1000, pendingBalance: 0,
        positions: [], transactions: [], withdrawals: [], notifications: [],
        series: {}, lastError: null,
        selectedSymbol: "EURUSD", durationMs: 60_000, payoutPct: 0.85,
      }),
    }),
    {
      name: "lumora-trade-v3",
      partialize: (s) => ({
        user: s.user,
        mode: s.mode,
        balance: s.balance, pendingBalance: s.pendingBalance,
        payoutPct: s.payoutPct, durationMs: s.durationMs, selectedSymbol: s.selectedSymbol,
        timeframe: s.timeframe, chartType: s.chartType, kesPerUsdt: s.kesPerUsdt,
        sidebarCollapsed: s.sidebarCollapsed,
        transactions: s.transactions.slice(0, 100),
        withdrawals: s.withdrawals.slice(0, 50),
        series: slimSeries(s.series),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try { (state as any).series = hydrateSeries((state as any).series); } catch { /* ignore */ }
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Persistence helpers — slim a CandleSeries down to plain numeric fields on
// write, and expand them back into proper Candle objects on read. We deliberately
// cap at 1,500 candles per symbol which keeps localStorage well under 1 MB
// while preserving the visible 25 hours of detail at 1-minute resolution.
// ---------------------------------------------------------------------------

function slimSeries(series: Record<string, CandleSeries>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(series)) {
    if (!v.candles?.length && !v.extended?.length) continue;
    const shrinkOne = (c: any) => ({
      s: c.start, o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume,
      b: c.bucketMs, ...(c.live ? { x: 1 } : {}),
    });
    out[k] = {
      symbol: v.symbol,
      baseMs: v.baseMs,
      lastChange: v.lastChange,
      tp: v.tp,
      candles: v.candles.slice(-1500).map(shrinkOne),
      extended: (v.extended || []).slice(-360).map(shrinkOne), // ~120d daily + ~6mo
    };
  }
  return out;
}

function hydrateSeries(raw: any): Record<string, CandleSeries> {
  const out: Record<string, CandleSeries> = {};
  if (!raw || typeof raw !== "object") return out;
  const now = Date.now();
  for (const [k, rawV] of Object.entries(raw as Record<string, any>)) {
    const v = rawV as any;
    if (!v?.candles?.length && !v?.extended?.length) continue;
    const expand = (c: any) => ({
      start: c.s,
      open: c.o, high: c.h, low: c.l, close: c.c, volume: c.v ?? 0,
      bucketMs: c.b ?? 60_000,
      live: c.x === 1 ? true : false,
      src: "init" as const,
    });
    const candles = (v.candles || []).map(expand);
    const extended = (v.extended || []).map(expand);
    if (!candles.length && !extended.length) continue;
    const last = candles[candles.length - 1] || extended[extended.length - 1];
    if (!last || (now - last.start) > 6 * 3600_000) {
      // Stale series (older than 6 hours) — drop and let the simulator re-seed.
      continue;
    }
    out[k] = {
      symbol: v.symbol ?? k,
      baseMs: v.baseMs ?? 60_000,
      candles, extended, lastChange: v.lastChange, tp: v.tp,
    };
  }
  return out;
}
