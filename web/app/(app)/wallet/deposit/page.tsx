"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { useAuth } from "@/lib/auth";
import { usdt } from "@/lib/money";
import { Icon } from "@/components/Icon";
import { LoaderCard, LoaderLogo, Spinner } from "@/components/Loader";

const MIN_USDT = 1;
const HERO = "/gettyimages-2207359409-612x612.jpg";
const POLL_MS = 3000;

type Phase =
  | { kind: "idle" }
  | { kind: "pending"; checkoutRequestID: string; kesAmount: number; usdtAmount: number; phone: string; since: number }
  | { kind: "verifying"; checkoutRequestID: string; kesAmount: number; usdtAmount: number; phone: string; started: number }
  | { kind: "completed"; usdtAmount: number; kesAmount: number; balanceUsdt: number }
  | { kind: "failed"; reason: string; usdtAmount: number };

export default function DepositPage() {
  const mode    = useTradeStore((s) => s.mode);
  const balance = useTradeStore((s) => s.balance);
  const rate    = useTradeStore((s) => s.kesPerUsdt);
  const transactions = useTradeStore((s) => s.transactions);
  const requestDeposit = useTradeStore((s) => s.requestDeposit);
  const confirmDeposit = useTradeStore((s) => s.confirmDeposit);
  const failDeposit = useTradeStore((s) => s.failDeposit);

  const auth = useAuth();

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(50);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // Reset to idle when entering page
  useEffect(() => { setPhase({ kind: "idle" }); }, []);

  // Poll loop driver
  useEffect(() => {
    if (phase.kind !== "verifying") return;
    const ctx = phase;
    const t = setInterval(async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
        if (!token) return;
        const elapsed = Date.now() - ctx.started;
        if (elapsed > 60_000) {
          failDeposit(ctx.checkoutRequestID);
          setPhase({ kind: "failed", reason: "Timed out waiting for M-Pesa", usdtAmount: ctx.usdtAmount });
          return;
        }
        const res = await fetch("/api/deposits/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ checkoutRequestID: ctx.checkoutRequestID }),
        });
        const j = await res.json();
        if (j.ok && j.status === "Completed" && typeof j.balanceUsdt === "number") {
          confirmDeposit(ctx.checkoutRequestID, ctx.usdtAmount, "server");
          useTradeStore.getState().applyRealtimeBalance(j.balanceUsdt);
          setPhase({ kind: "completed", usdtAmount: ctx.usdtAmount, kesAmount: ctx.kesAmount, balanceUsdt: j.balanceUsdt });
          return;
        }
        if (j.ok && j.status === "Failed") {
          if (j.pollingTimedOut) {
            // keep polling — server-side may still get a result
            return;
          }
          failDeposit(ctx.checkoutRequestID);
          setPhase({ kind: "failed", reason: "M-Pesa declined this transaction", usdtAmount: ctx.usdtAmount });
        }
      } catch { /* ignore per-tick */ }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [phase, confirmDeposit, failDeposit]);

  // Guest gate
  if (mode === "guest" || !auth.user) {
    return (
      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        <section className="relative h-32 rounded-md overflow-hidden border border-line hero-overlay mb-5">
          <Image src={HERO} alt="" fill sizes="100vw" priority className="object-cover opacity-25" />
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-amber">Demo mode</p>
              <h1 className="font-display text-3xl font-semibold mt-1">Deposit</h1>
            </div>
          </div>
        </section>

        <div className="rounded-md border border-line bg-bg-900 p-6">
          <p className="text-sm">You're playing on a demo account.</p>
          <p className="text-sm text-muted mt-1">To deposit real money via M-Pesa and trade with USDT, sign in or create an account. Your funds will be held in your real account and every deposit will be confirmed by M-Pesa before your balance updates.</p>
          <div className="mt-5 flex gap-2">
            <Link href="/login"    className="press px-4 py-2 rounded border border-line hover:border-green-bright text-sm">Log in</Link>
            <Link href="/register" className="press px-4 py-2 rounded bg-green text-bg-950 font-semibold text-sm hover:bg-green-bright">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  function looksPhone(p: string) { return /^(?:\+?254|0)(7|1)\d{8}$/.test(p.replace(/[^0-9]/g, "")); }

  async function startDeposit() {
    setPhase({ kind: "idle" });
    if (amount < MIN_USDT) { setPhase({ kind: "failed", reason: `Minimum deposit is ${MIN_USDT} USDT`, usdtAmount: amount }); return; }
    if (!looksPhone(phone)) { setPhase({ kind: "failed", reason: "Use a valid Kenyan phone (Safaricom preferred).", usdtAmount: amount }); return; }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    if (!token) { setPhase({ kind: "failed", reason: "Please sign in to deposit.", usdtAmount: amount }); return; }

    // Local "Processing" intent for instant UI feedback.
    const tempId = `pre-${Date.now().toString(36)}`;
    requestDeposit(amount, tempId);

    try {
      const res = await fetch("/api/deposits/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount_usdt: amount, phone }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      // Replace the local pre-id with the real checkoutRequestID.
      useTradeStore.setState((s) => ({
        transactions: s.transactions.map(t => t.id === tempId
          ? { ...t, id: j.checkoutRequestID, status: "Processing" as const }
          : t),
        pendingBalance: s.pendingBalance, // unchanged
      }));
      const now = Date.now();
      setPhase({ kind: "pending", checkoutRequestID: j.checkoutRequestID, kesAmount: j.kesAmount, usdtAmount: j.usdtAmount, phone, since: now });
      // Move the server-polling phase in shortly after so the user sees the "Verifying" state
      setTimeout(() => setPhase(prev => prev.kind === "pending" && prev.checkoutRequestID === j.checkoutRequestID
        ? { kind: "verifying", checkoutRequestID: j.checkoutRequestID, kesAmount: j.kesAmount, usdtAmount: j.usdtAmount, phone, started: now }
        : prev), 1200);
    } catch (e: any) {
      // Drop the local intent
      useTradeStore.setState((s) => ({
        transactions: s.transactions.filter(t => t.id !== tempId),
        pendingBalance: Math.max(0, s.pendingBalance - amount),
      }));
      setPhase({ kind: "failed", reason: e?.message ?? "Push failed", usdtAmount: amount });
    }
  }

  const kesAmount = Math.round(amount * rate);
  const presets = [1, 5, 10, 25, 50, 100, 1000];

  if (phase.kind === "completed") {
    return (
      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        <div className="rounded-md border border-green/40 bg-green/5 p-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-green">Deposit received</p>
          <p className="font-display text-2xl font-semibold mt-1">+{phase.usdtAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</p>
          <p className="text-sm text-muted mt-1">≈ {kesFmt(phase.kesAmount)} was charged to your M-Pesa. New balance: {usdt(phase.balanceUsdt)}.</p>
          <div className="mt-5 flex gap-2">
            <Link href="/trade"       className="press px-4 py-2 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright">Trade now</Link>
            <Link href="/wallet"      className="press px-4 py-2 rounded border border-line text-sm hover:border-green-bright">Wallet</Link>
          </div>
        </div>
      </div>
    );
  }

  const verifying = phase.kind === "verifying";
  const pending   = phase.kind === "pending";

  // Show a branded progress card during the deposit pipeline.
  if (pending || verifying) {
    return (
      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        <LoaderCard
          title={pending ? "Sending M-Pesa push…" : "Waiting for M-Pesa confirmation"}
          detail={
            pending
              ? `Authenticating your ${usdt(amount)} top-up with Safaricom. Your phone will buzz in a moment.`
              : "Authorize the prompt on your phone, then tap Continue. Lumora only credits your balance once M-Pesa confirms."
          }
        />
        <div className="mt-4 rounded-md border border-line bg-bg-900 p-4 animate-fade-up">
          <ul className="space-y-2 text-sm">
            <Step done label={`Push sent: KSh ${kesFmt(Math.round(amount * rate))} to ${mask(phone)}`} />
            <Step done active={verifying} spinner label="Phone prompts you to authorise" />
            <Step active label="M-Pesa confirms payment" />
            <Step label="Lumora balance credited" />
          </ul>
        </div>
        <p className="text-[11px] text-muted text-center mt-3">Press Esc or navigate away to cancel the wait. Your deposit row stays marked Processing until Safaricom replies.</p>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl">
      <Link href="/wallet" className="text-xs text-muted hover:text-ink">← Back to wallet</Link>

      <section className="relative h-32 rounded-md overflow-hidden border border-line hero-overlay animate-fade-in mt-2 mb-5">
        <Image src={HERO} alt="" fill sizes="100vw" priority className="object-cover opacity-25" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-green">Real account</p>
            <h1 className="font-display text-3xl font-semibold mt-1">Deposit USDT</h1>
          </div>
        </div>
      </section>

      <div className="rounded-md border border-line bg-bg-900 p-5 space-y-5">
        <div>
          <p className="text-xs text-muted">Step 1 · Choose method</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className="p-3 rounded border border-green bg-green/10 text-left">
              <p className="font-semibold text-sm">M-Pesa</p>
              <p className="text-xs text-muted mt-1">Direct push to your phone</p>
            </button>
            <button disabled className="p-3 rounded border border-line text-left text-muted">
              <p className="font-semibold text-sm">Bank transfer</p>
              <p className="text-xs text-muted mt-1">Coming soon</p>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted">Step 2 · Choose amount (USDT, ≥ {MIN_USDT}) — then pay</p>

          <div className="mt-2 grid grid-cols-12 gap-2">
            <div className="col-span-5 sm:col-span-4">
              <input type="number" min={MIN_USDT} value={amount}
                     onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                     className="w-full bg-bg-800 border border-line rounded px-3 py-2.5 text-2xl font-mono ring-focus" />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {presets.map(p => (
                  <button key={p} onClick={() => setAmount(p)} type="button"
                    className="press px-2 py-0.5 rounded bg-bg-800 border border-line text-[11px] hover:border-green-bright">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-7 sm:col-span-5 rounded border border-line bg-bg-800/50 px-3 py-2.5 flex flex-col justify-center">
              <p className="text-[10px] text-muted uppercase tracking-wider">You'll pay</p>
              <p className="text-2xl font-mono text-ink animate-tick">KSh {kesFmt(kesAmount)}</p>
              <p className="text-[10px] text-muted mt-0.5">Rate: 1 USDT = {rate.toFixed(2)} KES</p>
            </div>

            <button onClick={startDeposit} disabled={pending || verifying}
                    className="col-span-12 sm:col-span-3 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2 px-3 py-2.5 press animate-pulse-soft">
              {pending  ? <><Icon.Sparkle size={14} className="animate-pulse-soft" /> Sending…</> :
               verifying ? <><Icon.Sparkle size={14} className="animate-pulse-soft" /> Verifying…</> :
               <><Icon.Plus size={14} /> Deposit</>}
            </button>
          </div>

          <p className="mt-2 text-[11px] text-muted">Minimum {MIN_USDT} USDT. Rate 1 USDT = {rate.toFixed(2)} KES. Your M-Pesa prompt shows the exact KSh amount.</p>
        </div>

        <div>
          <p className="text-xs text-muted">Step 3 · Phone number</p>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678"
                 className="mt-2 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
        </div>

        {phase.kind === "failed" && (
          <div className="rounded border border-red/40 bg-red/10 p-3 text-sm text-red">
            <strong>Deposit not credited.</strong> {phase.reason}. Money was NOT added to your balance. Try again or use a different number.
          </div>
        )}

        {phase.kind === "failed" && (
          <div className="rounded border border-red/40 bg-red/10 p-3 text-sm text-red">
            <strong>Deposit not credited.</strong> {phase.reason}. Money was NOT added to your balance. Try again or use a different number.
          </div>
        )}

        <p className="text-[11px] text-muted">
          Minimum deposit: <span className="text-ink">{MIN_USDT} USDT</span>. We never auto-credit — your balance only updates after M-Pesa confirms your payment.
        </p>
      </div>

      <div className="mt-6 rounded-md border border-line bg-bg-900 p-5">
        <p className="text-sm">Deposit history</p>
        {transactions.filter(t => t.kind === "Deposit").length === 0 ? (
          <p className="text-xs text-muted mt-2">No deposits yet.</p>
        ) : (
          <ul className="divide-y divide-line mt-3">
            {transactions.filter(t => t.kind === "Deposit").slice(0, 5).map(t => (
              <li key={t.id} className="py-2 flex items-center text-sm">
                <span className="text-muted w-32">{new Date(t.at).toLocaleString()}</span>
                <span className={`px-2 py-0.5 text-[11px] rounded ${
                  t.status === "Completed" ? "bg-green/15 text-green" :
                  t.status === "Processing" ? "bg-amber/15 text-amber" :
                  t.status === "Failed" ? "bg-red/15 text-red" : "bg-bg-800 text-muted"
                }`}>{t.status}</span>
                <span className="ml-auto font-mono">{t.amountUSDT >= 0 ? "+" : ""}{t.amountUSDT.toFixed(2)} USDT</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[11px] text-muted">Wallet balance: {usdt(balance)}.</p>
      </div>
    </div>
  );
}

function kesFmt(n: number) {
  return n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

function mask(p: string) {
  const s = (p || "").replace(/[^0-9]/g, "");
  if (s.length < 7) return "***";
  return `${s.slice(0, 4)} •••• ${s.slice(-2)}`;
}

function Step({ done, active, label, spinner }: { done?: boolean; active?: boolean; label: string; spinner?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`w-5 h-5 grid place-items-center rounded text-[11px] font-semibold ${
        done ? "bg-green text-bg-950" : active ? "bg-bg-700 text-ink" : "bg-bg-800 text-muted"
      }`}>
        {spinner ? <Spinner size={12} /> : done ? "✓" : "•"}
      </span>
      <span className={done ? "text-ink" : active ? "text-ink" : "text-muted"}>{label}</span>
    </li>
  );
}
