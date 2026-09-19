"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { usdt, kes as kesFmt } from "@/lib/money";
import { LoaderCard } from "@/components/Loader";

export default function WithdrawPage() {
  const balance       = useTradeStore((s) => s.balance);
  const withdrawals   = useTradeStore((s) => s.withdrawals);
  const requestWd     = useTradeStore((s) => s.requestWithdrawal);
  const rate          = useTradeStore((s) => s.kesPerUsdt);
  const [amount, setAmount]   = useState(50);
  const [phone, setPhone]     = useState("");
  const [method, setMethod]   = useState<"M-Pesa" | "Bank">("M-Pesa");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const recent = withdrawals.find(w => w.phone)?.phone;
    if (recent && !phone) setPhone(recent);
  }, [withdrawals, phone]);

  async function submit() {
    setErr(null); setSubmitError(null);
    if (amount < 10)              { setErr("Minimum withdrawal is 10 USDT."); return; }
    if (amount > balance)         { setErr("You don't have enough balance."); return; }
    if (method === "M-Pesa" && !/^(?:\+?254|0)(7|1)\d{8}$/.test(phone.replace(/[^0-9]/g, ""))) {
      setErr("Enter a valid M-Pesa number."); return;
    }
    setSubmitting(true);
    const e = await requestWd(amount, method, phone);
    if (e) {
      setSubmitError(e);
      setSubmitting(false);
    } else {
      setSubmitting(false);
    }
  }

  if (submitting) {
    return <LoaderCard title="Submitting withdrawal request…" detail="We forward your request to our review queue. This usually takes a moment." />;
  }

  const lastSubmitted = withdrawals[0]; // most recent first
  if (lastSubmitted && !lastSubmitted.status || (lastSubmitted && lastSubmitted.status === "Processing" && !submitting && !err)) {
    // Show the "received" page once a row exists.
  }
  const showReceived = !submitting && !submitError && err == null && withdrawals.length > 0 && lastSubmitted?.id && Date.now() - lastSubmitted.requestedAt < 1500;

  if (showReceived) {
    return (
      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        <Link href="/wallet" className="text-xs text-muted hover:text-ink">← Back to wallet</Link>
        <div className="mt-3 rounded-md border border-line bg-bg-900 p-6 animate-fade-up">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber">Submitted · processing</p>
          <p className="font-display text-2xl font-semibold mt-1">Withdrawal request received</p>
          <p className="text-sm text-muted mt-1">Your withdrawal is being processed by our team.</p>
          <div className="mt-4 rounded border border-line bg-bg-800/40 p-4 text-sm">
            <Row label="Amount" value={<span className="font-mono">{lastSubmitted.amountUSDT.toFixed(2)} USDT</span>} />
            <Row label="Method" value={<span className="font-mono">{lastSubmitted.method}{lastSubmitted.phone ? ` · ${mask(lastSubmitted.phone)}` : ""}</span>} />
            <Row label="Reference" value={<span className="font-mono text-[11px]">{lastSubmitted.id}</span>} />
            <Row label="Status" value={<span className="text-amber">Processing</span>} />
          </div>
          <div className="mt-4 p-4 rounded border border-amber/30 bg-amber/5 text-sm text-amber">
            Please allow up to <strong>24 hours</strong> for processing. We'll update you when it's done.
          </div>
          <div className="mt-5 flex gap-2">
            <Link href="/wallet" className="press px-3 py-2 rounded border border-line hover:border-green-bright text-sm">Back to wallet</Link>
            <Link href="/wallet/transactions" className="press px-3 py-2 rounded bg-green text-bg-950 text-sm font-semibold hover:bg-green-bright">View transactions</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl">
      <Link href="/wallet" className="text-xs text-muted hover:text-ink">← Back to wallet</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">Withdraw USDT</h1>
      <p className="text-muted text-sm mt-1">Move funds from your Lumora balance to M-Pesa or your bank.</p>

      <div className="mt-5 rounded-md border border-line bg-bg-900 p-5 space-y-4">
        <div>
          <p className="text-xs text-muted">Available</p>
          <p className="text-2xl font-mono mt-1">{usdt(balance)} <span className="text-sm text-muted">≈ {kesFmt(balance * rate)}</span></p>
        </div>

        <div>
          <p className="text-xs text-muted">Amount (USDT)</p>
          <div className="mt-1 grid grid-cols-12 gap-2 items-stretch">
            <input type="number" min={10} value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="col-span-7 sm:col-span-5 w-full bg-bg-800 border border-line rounded px-3 py-2.5 text-2xl font-mono ring-focus" />
            <div className="col-span-5 sm:col-span-4 rounded border border-line bg-bg-800/50 px-3 py-2 flex flex-col justify-center">
              <p className="text-[10px] text-muted uppercase tracking-wider">You'll receive</p>
              <p className="text-xl font-mono text-ink">KSh {kesFmt(amount * rate)}</p>
            </div>
            <button onClick={submit}
              className="col-span-12 sm:col-span-3 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright press inline-flex items-center justify-center gap-2 px-3 py-2.5">
              Withdraw
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {[10, 50, 100, 500, 1000, balance].map((p, i) => (
              <button key={i} onClick={() => setAmount(Math.max(10, Math.min(balance, Math.floor(p))))} type="button"
                className="press px-2 py-0.5 rounded bg-bg-800 border border-line text-[11px] hover:border-green-bright">
                {i === 5 ? "all" : p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted">Method</p>
          <div className="mt-1 flex gap-2">
            {(["M-Pesa", "Bank"] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`px-3 py-2 rounded border text-sm press ${method === m ? "border-green bg-green/10" : "border-line hover:border-green-bright"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {method === "M-Pesa" && (
          <label className="block">
            <span className="text-xs text-muted">M-Pesa number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678"
              className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
          </label>
        )}

        <div className="rounded border border-amber/30 bg-amber/5 p-3 text-sm">
          <p className="text-amber font-semibold">Processing time</p>
          <p className="text-muted mt-1">Withdrawals may take up to <strong className="text-ink">24 hours</strong> to review and process.</p>
        </div>

        {err && <p className="text-sm text-red">{err}</p>}
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

function mask(p: string) {
  const s = (p || "").replace(/[^0-9]/g, "");
  if (s.length < 7) return "***";
  return `${s.slice(0, 4)} •••• ${s.slice(-2)}`;
}
