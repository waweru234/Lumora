import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { TryDemoLink } from "@/components/TryDemoLink";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Footer } from "@/components/Footer";
import { ASSETS } from "@/lib/assets";
import { ThemeToggle } from "@/components/ThemeToggle";

const MARKETS = [
  { symbol: "EUR/USD", img: "/gettyimages-1287644807-612x612.jpg" },
  { symbol: "GBP/USD", img: "/gettyimages-1334805030-612x612.jpg" },
  { symbol: "USD/JPY", img: "/gettyimages-1560536860-612x612.jpg" },
  { symbol: "XAU/USD", img: "/gettyimages-2187633207-612x612.jpg" },
  { symbol: "BTC/USD", img: "/gettyimages-1503239849-612x612.jpg" },
  { symbol: "ETH/USD", img: "/gettyimages-2207359409-612x612.jpg" },
];

const HERO_BG = "/ChatGPT%20Image%20Sep%2019,%202026,%2009_32_29%20AM.png";
const PARTNERS = [
  { src: "/images.png",     alt: "Partner" },
  { src: "/download.jfif",  alt: "Partner" },
  { src: "/download.png",   alt: "Partner" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg-950 text-ink overflow-x-hidden">
      <ScrollReveal />

      {/* top nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-6">
          <Link href="/" className="press"><Logo size={32} withWord={true} /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted ml-auto">
            <Link href="#markets" className="hover:text-ink">Markets</Link>
            <Link href="#about" className="hover:text-ink">About</Link>
            <Link href="#partners" className="hover:text-ink">Partners</Link>
            <Link href="/legal" className="hover:text-ink">Legal</Link>
          </nav>
          <div className="ml-auto md:ml-6 flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="press hidden sm:inline-block px-3 py-1.5 text-sm text-ink hover:underline">Log in</Link>
            <Link href="/register" className="press hidden sm:inline-block px-3 py-1.5 rounded bg-green text-bg-950 text-sm font-semibold hover:bg-green-bright">Create account</Link>
          </div>
        </div>
      </header>

      {/* HERO — entirely driven by your ChatGPT image as background */}
      <section className="relative min-h-[100svh] grid place-items-center overflow-hidden bg-bg-950">
        <Image src={HERO_BG} alt="Lumora hero background" fill priority sizes="100vw"
               className="object-cover opacity-60 animate-fade-in" />
        <div className="absolute inset-0 hero-overlay animate-fade-in [animation-delay:120ms]" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 30%, rgba(34,197,94,0.18) 0%, transparent 60%), " +
              "radial-gradient(60% 50% at 80% 80%, rgba(34,197,94,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center" data-reveal>
          <p className="text-[11px] sm:text-xs tracking-[0.4em] uppercase text-green">Lumora · Built in Kenya. Made for Africa.</p>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] mt-4">
            Trade markets.<br />Understand every move.
          </h1>
          <p className="text-muted text-sm sm:text-base mt-5 max-w-xl mx-auto">
            A simple, fast and transparent trading experience. Watch the markets, learn what's moving, decide with knowledge.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Link href="/register" data-reveal="scale"
                  className="press px-5 py-3 rounded-md bg-green text-bg-950 font-semibold text-sm hover:bg-green-bright inline-flex items-center justify-center gap-2">
              + Create account → Trade real
            </Link>
            <TryDemoLink />
          </div>

          <p className="mt-4 text-[11px] text-muted">
            Demo uses simulated funds. Real trading needs an M-Pesa deposit in Kenyan Shillings · Minimum 1 USDT.
          </p>
        </div>

        <div className="absolute bottom-6 inset-x-0 flex justify-center">
          <a href="#markets" className="press text-muted text-xs flex flex-col items-center gap-1 hover:text-ink">
            <span>Scroll to explore markets</span>
            <span className="animate-pulse-soft">▾</span>
          </a>
        </div>
      </section>

      {/* Markets strip — 6 pair cards */}
      <section id="markets" className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8" data-reveal>
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted">Markets</p>
            <h2 className="font-display text-2xl font-semibold mt-1">Six pairs. Same simplicity.</h2>
            <p className="text-sm text-muted mt-1">Forex majors, crypto, and gold. Look around — no sign-in needed.</p>
          </div>
          <Link href="/markets" className="press text-sm text-green hover:underline self-start sm:self-auto">See all markets →</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MARKETS.map((m) => (
            <article key={m.symbol}
                     data-reveal="scale"
                     className="relative rounded-md overflow-hidden border border-line bg-bg-900 press hover:border-green-bright transition-colors">
              <div className="relative h-20">
                <Image src={m.img} alt="" fill sizes="(min-width: 1024px) 16vw, 33vw" className="object-cover opacity-30" />
                <div className="absolute inset-0 hero-overlay" />
              </div>
              <div className="p-3">
                <p className="text-[10px] text-muted uppercase tracking-wider">Pair</p>
                <p className="font-semibold text-sm mt-1">{m.symbol}</p>
                <p className="text-[11px] text-muted mt-1 font-mono">{(ASSETS.find(a => a.display === m.symbol)?.spreadBps ?? 0).toString()} spread</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="border-t border-b border-line bg-bg-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center" data-reveal>
          <p className="font-script text-3xl sm:text-4xl text-green leading-snug">Clarity before confidence.</p>
          <p className="font-script text-3xl sm:text-4xl text-ink mt-2 leading-snug">Knowledge before decisions.</p>
        </div>
      </section>

      {/* About sketch */}
      <section id="about" className="max-w-6xl mx-auto px-4 lg:px-6 py-20 grid md:grid-cols-2 gap-8 items-center">
        <div data-reveal="left">
          <div className="relative h-72 rounded-md overflow-hidden border border-line">
            <Image src="/gettyimages-1503239849-612x612.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-50" />
            <div className="absolute inset-0 hero-overlay" />
          </div>
        </div>
        <div data-reveal="right">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted">About Lumora</p>
          <h2 className="font-display text-2xl font-semibold mt-1">Built in Kenya. Made for Africa.</h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Lumora is a Kenyan-born financial learning platform. We explain markets simply so people can decide with confidence. No fake testimonials. No guaranteed returns.
            We tell you the risk before you take the trade.
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            <Li><b>Designed for Kenyans first.</b> Sign in with Google or email/password. Deposit via M-Pesa in KSh. Trade in USDT.</Li>
            <Li><b>Real data.</b> Your account lives in a real database so every position, deposit, and withdrawal sticks with you.</Li>
            <Li><b>Clear language.</b> "Here is what this means. Here is the risk. Take your time."</Li>
          </ul>

          <Link href="/about" className="press mt-5 inline-block text-sm text-green hover:underline">Read more about Lumora →</Link>
        </div>
      </section>

      {/* Partners — using the 3 icons you supplied */}
      <section id="partners" className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
          <div className="text-center" data-reveal>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted">Partners</p>
            <h2 className="font-display text-2xl font-semibold mt-1">Trusted by people who move markets.</h2>
            <p className="text-sm text-muted mt-2 max-w-xl mx-auto">Companies and institutions Lumora works with to keep markets understandable for everyday users in Africa.</p>
          </div>
          <div className="mt-10 grid grid-cols-3 sm:grid-cols-3 gap-4 items-stretch">
            {PARTNERS.map((p, i) => (
              <div key={i}
                   data-reveal="scale"
                   style={{ transitionDelay: `${i * 80}ms` }}
                   className="rounded-md border border-line bg-bg-900 p-6 flex items-center justify-center press hover:border-green-bright transition-colors">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 grid place-items-center">
                  <Image src={p.src} alt={p.alt} fill sizes="128px" className="object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-bg-900">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center" data-reveal>
          <h2 className="font-display text-2xl font-semibold">Ready when you are.</h2>
          <p className="text-sm text-muted mt-2">Open an account, or play the demo with virtual funds first.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/register" className="press px-5 py-3 rounded-md bg-green text-bg-950 font-semibold text-sm hover:bg-green-bright">Create account → Trade real</Link>
            <TryDemoLink />
          </div>
          <p className="mt-4 text-[11px] text-muted">Trade responsibly. Lumora is a simulation.</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-ink">
      <span className="text-green mt-0.5">→</span>
      <span>{children}</span>
    </li>
  );
}
