"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useTradeStore } from "@/store/useTradeStore";
import type { DBTransactionRow, DBWithdrawal } from "@/lib/supabase-schema";

type Snapshot = {
  profile: any | null;
  transactions: DBTransactionRow[];
  withdrawals: DBWithdrawal[];
  realtimeBalanceUsdt: number | null;
  serverTimeISO: string;
};

/** Pull profile + transactions + withdrawals from Supabase whenever the
 *  Firebase user changes (currentUser present). Maps to the local store so
 *  every page reads the same data without round-tripping.
 *
 *  Also exposes `refresh()` for "pull again" buttons in /wallet etc. */
export function useSupabaseSync() {
  const auth = useAuth();
  const lastSyncForUid = useRef<string | null>(null);
  const inflight = useRef<boolean>(false);

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    if (!token) return null;
    if (typeof window === "undefined") return null;

    inflight.current = true;
    try {
      const headers = { authorization: `Bearer ${token}` };

      const [profRes, txRes, wdRes] = await Promise.all([
        fetch("/api/profile",               { headers, cache: "no-store" }),
        fetch("/api/transactions",          { headers, cache: "no-store" }),
        fetch("/api/withdrawals",           { headers, cache: "no-store" }),
      ]);

      let snap: Snapshot = { profile: null, transactions: [], withdrawals: [], realtimeBalanceUsdt: null, serverTimeISO: new Date().toISOString() };

      if (profRes.ok) {
        const j = await profRes.json();
        if (j.ok && j.profile) {
          snap.profile = j.profile;
          const b = Number(j.profile.balance_usdt ?? 0);
          if (Number.isFinite(b)) snap.realtimeBalanceUsdt = b;
        }
      }
      if (txRes.ok) {
        const j = await txRes.json();
        if (j.ok && Array.isArray(j.transactions)) snap.transactions = j.transactions;
      }
      if (wdRes.ok) {
        const j = await wdRes.json();
        if (j.ok && Array.isArray(j.withdrawals)) snap.withdrawals = j.withdrawals;
      }

      // Push back to the store.
      const s = useTradeStore.getState();
      useTradeStore.setState({
        mode: "real",
        realtimeBalanceUsdt: snap.realtimeBalanceUsdt,
        balance: snap.realtimeBalanceUsdt ?? 1000,
        transactions: snap.transactions.map(t => ({
          id: t.id,
          kind: t.kind,
          symbol: t.symbol,
          amountUSDT: Number(t.amount_usdt ?? 0),
          status: t.status,
          at: Date.parse(t.at) || Date.now(),
        })) as any,
        withdrawals: snap.withdrawals.map(w => ({
          id: w.id,
          amountUSDT: Number(w.amount_usdt ?? 0),
          method: (w.method === "Bank" ? "Bank" : "M-Pesa"),
          phone: w.phone ?? null,
          status: (w.status || "Processing") as any,
          requestedAt: Date.parse(w.requested_at) || Date.now(),
          etaHours: Number(w.eta_hours ?? 24),
        })) as any,
      });

      return snap;
    } catch (e) {
      // Soft-fail; local state remains intact.
      return null;
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    const uid = auth.user?.uid;
    if (!uid) return;
    if (lastSyncForUid.current === uid) return;
    lastSyncForUid.current = uid;
    refresh();
  }, [auth.user?.uid, refresh]);

  return { refresh, inflight };
}
