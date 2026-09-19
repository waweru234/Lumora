"use client";
import Link from "next/link";
import Image from "next/image";
import { useTradeStore } from "@/store/useTradeStore";
import { usdt, kes as kesFmt, sign } from "@/lib/money";
import { fmtTime } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

const HERO = "/gettyimages-2207359409-612x612.jpg";

export default function WalletHome() {
  const balance      = useTradeStore((s) => s.balance);
  const pending      = useTradeStore((s) => s.pendingBalance);
  const withdrawals  = useTradeStore((s) => s.withdrawals);
  const transactions = useTradeStore((s) => s.transactions);
  const kesRate      = useTradeStore((s) => s.kesPerUsdt);
  const user         = useTradeStore((s) => s.user);
  const mode        = useTradeStore((s) => s.mode);

  const reserved = withdrawals.filter(w => w.status === "Processing").reduce((s, w) => s + w.amountUSDT, 0);

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 max-w-5xl animate-fade-in">
      <section className="relative h-32 rounded-md overflow-hidden border border-line hero-overlay animate-fade-up">
        <Image src={HERO} alt="" fill sizes="100vw" priority className="object-cover opacity-25" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted">Your money</p>
            <h1 className="font-display text-3xl font-semibold mt-1">Wallet</h1>
            <p className="text-sm text-muted mt-1">Know your balance. Know your trade. Know your status.</p>
          </div>
        </div>
      </section>

      <div className="rounded-md border border-line bg-bg-900 p-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <p className="text-xs text-muted">Available balance</p>
        <p className="text-3xl font-mono mt-1 animate-tick">{usdt(balance)}</p>
        <p className="text-sm text-muted mt-1">≈ {kesFmt(balance * kesRate)} · rate {kesRate.toFixed(2)} KES / USDT</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
          <Cell label="Pending"      value={usdt(pending)} />
          <Cell label="Reserved"     value={usdt(reserved)} />
          <Cell label="Verification" value={user?.kyc ?? "Unverified"} />
        </div>
        <div className="mt-5 flex gap-2">
          <Link href="/wallet/deposit"  className="press px-4 py-2 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright">Deposit</Link>
          <Link href="/wallet/withdraw" className="press px-4 py-2 rounded border border-line hover:border-green-bright">Withdraw</Link>
        </div>

        {mode === "real" && balance === 0 && (
          <div className="mt-4 rounded border border-amber/30 bg-amber/5 p-3 text-sm text-amber animate-fade-up">
            <p className="font-semibold">Your account is set up but your balance is 0 USDT.</p>
            <p className="text-amber/80 mt-1">
              Deposit via M-Pesa to start trading. Your data (profile, balance, transactions) already lives in the database — top up below.
            </p>
            <Link href="/wallet/deposit" className="press mt-2 inline-block text-ink underline">Deposit USDT now →</Link>
          </div>
        )}
      </div>

      <div className="rounded-md border border-line bg-bg-900 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="text-sm">Recent activity</p>
          <Link href="/wallet/transactions" className="text-xs text-green">View all</Link>
        </div>
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {transactions.slice(0, 6).map((t, i) => (
              <li key={t.id} className="px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <StatusPill status={t.status} />
                <p className="text-ink">{t.kind} {t.symbol !== "USDT" && t.symbol !== "M-Pesa" && t.symbol !== "Bank" ? `· ${t.symbol}` : ""}</p>
                <p className="ml-auto font-mono">{sign(t.amountUSDT)}{Math.abs(t.amountUSDT).toFixed(2)} USDT</p>
                <p className="text-xs text-muted w-24 text-right">{fmtTime(t.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono">{value}</p>
    </div>
  );
}
