"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { fmtPrice, fmtTime } from "@/lib/format";
import { usdt, kes as kesFmt, sign } from "@/lib/money";
import { MiniChart } from "@/components/MiniChart";
import { Icon } from "@/components/Icon";
import { StatusPill } from "@/components/StatusPill";

const HERO_IMG = "/gettyimages-1503239849-612x612.jpg";

export default function DashboardPage() {
  const user = useTradeStore((s) => s.user);
  const balance = useTradeStore((s) => s.balance);
  const symbol  = useTradeStore((s) => s.selectedSymbol);
  const setSymbol = useTradeStore((s) => s.setSymbol);
  const timeframe = useTradeStore((s) => s.timeframe);
  const positions = useTradeStore((s) => s.positions);
  const transactions = useTradeStore((s) => s.transactions);
  const kesRate = useTradeStore((s) => s.kesPerUsdt);

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
  }, []);
  const todayPnL = transactions.filter(t => t.at >= todayStart && t.kind === "Trade result").reduce((s, t) => s + t.amountUSDT, 0);

  const asset = ASSETS.find(a => a.symbol === symbol)!;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 max-w-7xl animate-fade-in">
      <section className="relative h-32 rounded-md overflow-hidden border border-line hero-overlay animate-fade-up">
        <Image src={HERO_IMG} alt="" fill sizes="100vw" priority className="object-cover opacity-30" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted">{greeting},</p>
            <h1 className="font-display text-3xl font-semibold mt-1">{user?.name ?? "Trader"}</h1>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card label="Balance"   big={usdt(balance)} sub={`≈ ${kesFmt(balance * kesRate)}`} delay={0} />
        <Card label="Today P&L" big={`${sign(todayPnL)}${Math.abs(todayPnL).toFixed(2)} USDT`}
              sub={todayPnL >= 0 ? "Up today" : "Down today"} positive={todayPnL >= 0} delay={80} />
        <Card label="Open trades" big={String(positions.filter(p => !p.closed).length)} sub={`${positions.filter(p => p.closed).length} completed`} delay={160} />
      </div>

      <div className="rounded-md border border-line bg-bg-900 p-4 lg:p-5 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon.Markets size={16} />
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Market overview</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
                    className="bg-bg-800 border border-line rounded px-3 py-1.5 text-sm ring-focus">
              {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.display}</option>)}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-[1.6fr_1fr] gap-4 items-stretch">
          <div className="rounded-md border border-line bg-bg-800/50 p-2">
            <MiniChart height={180} />
          </div>
          <div className="grid grid-cols-2 gap-3 content-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">Pair</p>
              <p className="font-display text-xl mt-1">{asset.display}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">Kind</p>
              <p className="text-sm mt-1 capitalize">{asset.kind}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">Volatility</p>
              <p className="text-sm mt-1">{(asset.volatility * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">Spread</p>
              <p className="text-sm mt-1 font-mono">{asset.spreadBps}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">Open the <Link href="/trade" className="text-green underline">Trade terminal</Link> for the full chart. Values are illustrative.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard href="/trade"        title="Place a trade" description="Pick a market, set your amount and time, choose up or down." cta="Open trade terminal" image="/gettyimages-1334805030-612x612.jpg" icon={<Icon.Trade size={16} />} accent />
        <ActionCard href="/wallet/deposit" title="Wallet"     description="Top up with M-Pesa, or request a withdrawal."              cta="Deposit"               image="/gettyimages-2207359409-612x612.jpg" icon={<Icon.Wallet size={16} />} />
      </div>

      <div className="rounded-md border border-line bg-bg-900 animate-fade-up" style={{ animationDelay: "260ms" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Icon.History size={14} />
            <p className="text-sm">Recent activity</p>
          </div>
          <Link href="/history" className="text-xs text-green hover:underline">See all</Link>
        </div>
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-muted">No trades yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {transactions.slice(0, 6).map((t, i) => (
              <li key={t.id} className="px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
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

function Card({ label, big, sub, positive, delay = 0 }: { label: string; big: string; sub?: string; positive?: boolean; delay?: number }) {
  return (
    <div className="rounded-md border border-line bg-bg-900 p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-mono ${positive === true ? "text-green" : positive === false ? "text-red" : ""}`}>{big}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

function ActionCard({ href, title, description, cta, image, icon, accent }: { href: string; title: string; description: string; cta: string; image: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Link href={href} className={`relative rounded-md border border-line bg-bg-900 overflow-hidden press hover:border-green-bright transition-colors animate-fade-up block`}>
      <div className="relative h-24">
        <Image src={image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 hero-overlay" />
      </div>
      <div className="p-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted"><span>{icon}</span><span>Quick action</span></div>
          <h3 className="font-display text-lg font-semibold mt-1">{title}</h3>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>
        <span className={`shrink-0 px-3 py-1.5 rounded text-sm font-semibold ${accent ? "bg-green text-bg-950 hover:bg-green-bright" : "border border-line hover:border-green-bright"}`}>{cta}</span>
      </div>
    </Link>
  );
}
