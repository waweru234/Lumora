import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";

export function PublicHero({ image, eyebrow, title, subtitle, primaryHref, primaryLabel, secondaryHref, secondaryLabel, children }: {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  primaryHref: string;  primaryLabel: string;
  secondaryHref?: string; secondaryLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative h-[280px] sm:h-[340px] overflow-hidden border-y border-line hero-overlay animate-fade-in">
      <Image src={image} alt="" fill sizes="100vw" priority className="object-cover opacity-50" />
      <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-6 flex flex-col justify-end pb-8">
        <p className="text-[11px] tracking-[0.25em] uppercase text-green animate-fade-up">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl sm:text-5xl font-semibold leading-[1.05] animate-fade-up" style={{ animationDelay: "60ms" }}>{title}</h1>
        <p className="mt-3 text-muted max-w-2xl animate-fade-up" style={{ animationDelay: "120ms" }}>{subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <Link href={primaryHref} className="press px-5 py-2.5 rounded-md bg-green text-bg-950 font-semibold hover:bg-green-bright">{primaryLabel}</Link>
          {secondaryHref && (
            <Link href={secondaryHref} className="press px-5 py-2.5 rounded-md border border-line text-ink hover:border-green-bright">{secondaryLabel}</Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function TradeHero({ image, market, change, onChangeMarket, children }: {
  image?: string;
  market: string; change: number; onChangeMarket: () => void;
  children?: React.ReactNode;
}) {
  const up = change >= 0;
  return (
    <section className="relative h-[200px] sm:h-[260px] overflow-hidden border-b border-line hero-overlay animate-fade-in">
      {image && <Image src={image} alt="" fill sizes="100vw" priority className="object-cover opacity-35" />}
      <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-6 flex items-end justify-between pb-6">
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted animate-fade-up">Markets, simplified</p>
          <button onClick={onChangeMarket} className="mt-2 flex items-baseline gap-3 press animate-fade-up" style={{ animationDelay: "60ms" }}>
            <span className="font-display text-4xl sm:text-5xl font-semibold">{market}</span>
            <span className={`font-mono text-sm ${up ? "text-green" : "text-red"}`}>{up ? "▲" : "▼"} {change.toFixed(2)}%</span>
          </button>
        </div>
        <div className="hidden sm:block text-right text-muted text-xs">
          <p>Click the market name to cycle through pairs.</p>
          <p className="mt-1">Every value is illustrative. No real money is at risk.</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminHero({ image, title, subtitle }: { image?: string; title: string; subtitle?: string }) {
  return (
    <section className="relative h-[140px] overflow-hidden border-b border-line hero-overlay animate-fade-in">
      {image && <Image src={image} alt="" fill sizes="100vw" priority className="object-cover opacity-25" />}
      <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-6 flex items-end pb-5">
        <div className="flex items-center gap-3">
          <Logo size={24} withWord={false} />
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber/10 text-amber tracking-wider uppercase">Internal</span>
        </div>
      </div>
    </section>
  );
}

export function ScriptNote({ children }: { children: React.ReactNode }) {
  return <span className="font-script">{children}</span>;
}
