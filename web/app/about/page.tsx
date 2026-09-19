import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg-950 text-ink">
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-6">
          <Link href="/" className="press font-display font-semibold tracking-[0.18em]">LUMORA</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted ml-auto">
            <Link href="/register" className="press px-3 py-1.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright">Create account</Link>
            <Link href="/login"    className="hover:text-ink">Log in</Link>
          </nav>
        </div>
      </header>

      <section className="relative h-[300px] sm:h-[360px] overflow-hidden border-b border-line hero-overlay animate-fade-in">
        <Image src="/gettyimages-1503239849-612x612.jpg" alt="" fill priority className="object-cover opacity-40" />
        <div className="relative h-full max-w-5xl mx-auto px-4 lg:px-6 flex flex-col justify-end pb-8">
          <p className="text-[11px] tracking-[0.25em] uppercase text-green">Built in Kenya. Made for Africa.</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-semibold">Lumora</h1>
          <p className="mt-3 text-muted max-w-xl">Trade with clarity. Understand every move. Make decisions on what you actually know.</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10 text-sm leading-relaxed animate-fade-up">
        <Section title="Who we are">
          <p>
            Lumora is a Kenyan-born financial learning platform built to make markets and money easier to understand.
            We started because too many financial products are explained in language that intimidates ordinary people — and too many people lose money because no one told them the risk in plain words.
          </p>
          <p>
            We are Kenyan at heart, African in outlook, and global in ambition. Every line of copy on Lumora is reviewed for clarity before it ships.
          </p>
        </Section>

        <Section title="What we believe">
          <ul className="space-y-2">
            <Li>Financial knowledge should not be complicated, intimidating, or reserved for experts.</Li>
            <Li>People deserve to know the risk before they take the position.</Li>
            <Li>Software should respect the user — no fake testimonials, no guaranteed-return promises.</Li>
            <Li>Transparency is a feature, not a slogan.</Li>
          </ul>
        </Section>

        <Section title="How we communicate">
          <p>Clear. Honest. Respectful. Human.</p>
          <p>Instead of complicated language, we say:</p>
          <ul className="space-y-1 italic text-ink/90">
            <Li>“Here is what this means.”</Li>
            <Li>“Here is the risk.”</Li>
            <Li>“Here is what you should understand.”</Li>
            <Li>“Take your time and make an informed decision.”</Li>
          </ul>
        </Section>

        <Section title="What we will not promise">
          <p>No guaranteed profits. No “win every trade.” No fake success screenshots. No pretending risk doesn't exist. If something on Lumora could lose you money, we tell you before you take the trade.</p>
          <p>Our trust statement: <strong>Clarity before confidence. Knowledge before decisions.</strong></p>
        </Section>

        <Section title="How the platform works today">
          <p>Sign in (you can use email + password or Google — both are handled by Firebase Authentication). Your data — profile, trades, deposits, withdrawals — is stored in Supabase, linked to your Firebase user by a unique <code>firebase_uid</code> column. So when you sign in, Lumora recognises you across every page.</p>
          <p>Deposits go through Safaricom M-Pesa STK Push — you see the amount in Kenyan Shillings on your phone, and your Lumora balance is credited in USDT with a 1:1 confirmation step. Money is only ever credited after M-Pesa confirms.</p>
        </Section>
      </article>

      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-muted">{children}</div>
    </section>
  );
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2"><span className="text-green">→</span><span>{children}</span></li>;
}
