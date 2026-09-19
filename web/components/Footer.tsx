import Link from "next/link";
import { Logo } from "@/components/Logo";

const SLOGAN = "Built in Kenya. Made for Africa.";
const TAGLINE = "Trade with clarity";

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Trade",
    links: [
      { href: "/markets", label: "Markets" },
      { href: "/trade",   label: "Trade terminal" },
      { href: "/wallet",  label: "Wallet" },
      { href: "/history", label: "History" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account/profile",  label: "Profile" },
      { href: "/account/security", label: "Security" },
      { href: "/verification",     label: "Verification" },
      { href: "/notifications",    label: "Notifications" },
    ],
  },
  {
    title: "Brand",
    links: [
      { href: "/about", label: "About Lumora" },
      { href: "/legal", label: "Risk & legal" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const isLight = tone === "light";
  return (
    <footer className={`mt-12 border-t ${isLight ? "border-bg-200 bg-bg-100 text-bg-950" : "border-line bg-bg-900/60 text-muted"}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" className="press inline-flex items-center gap-2 mb-3">
            <Logo size={26} tone={tone} withWord={false} />
            <span className={`font-display font-semibold tracking-[0.18em] text-[15px] leading-none ${isLight ? "text-bg-950" : "text-ink"}`}>LUMORA</span>
          </Link>
          <p className={`text-sm ${isLight ? "text-bg-950/80" : "text-muted"}`}>{SLOGAN}</p>
          <p className="text-[11px] mt-2 font-script text-sm opacity-80">{TAGLINE}.</p>
          <p className="mt-4 text-[11px] leading-relaxed max-w-xs">
            Kenyan-born, designed for the rest of Africa. We explain markets in clear language so people can decide with confidence.
          </p>
        </div>

        {SECTIONS.map(s => (
          <div key={s.title}>
            <p className={`text-[11px] uppercase tracking-[0.25em] mb-3 ${isLight ? "text-bg-950/80" : "text-muted"}`}>{s.title}</p>
            <ul className="space-y-1 text-sm">
              {s.links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className={`press ${isLight ? "hover:text-bg-950 hover:underline" : "hover:text-ink"}`}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={`border-t ${isLight ? "border-bg-200" : "border-line"}`}>
        <div className={`max-w-7xl mx-auto px-4 lg:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] ${isLight ? "text-bg-950/70" : "text-muted"}`}>
          <p>© {new Date().getFullYear()} Lumora — {SLOGAN}.</p>
          <p>Clarity before confidence. Knowledge before decisions.</p>
        </div>
      </div>
    </footer>
  );
}
