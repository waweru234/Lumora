"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTradeStore } from "@/store/useTradeStore";
import { ASSETS } from "@/lib/assets";
import { usdt } from "@/lib/money";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { Toasts } from "@/components/Toasts";
import { useAuth } from "@/lib/auth";
import { AuthSyncBridge } from "@/components/AuthSyncBridge";
import { AccountDropdown } from "@/components/AccountDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSupabaseSync } from "@/components/useSupabaseSync";
import { SignOutLink } from "@/components/SignOutLink";
import { useEffect } from "react";

type NavItem = { href: string; label: string; icon: keyof typeof Icon };

const NAV: NavItem[] = [
  { href: "/",                        label: "Home",      icon: "Logo"      },
  { href: "/dashboard",              label: "Overview",  icon: "Markets"   },
  { href: "/trade",                  label: "Trade",     icon: "Trade"     },
  { href: "/markets",                label: "Markets",   icon: "Markets"   },
  { href: "/wallet",                 label: "Wallet",    icon: "Wallet"    },
  { href: "/history",                label: "History",   icon: "History"   },
  { href: "/wallet/transactions",    label: "Transactions", icon: "Filter" },
  { href: "/account/profile",        label: "Profile",   icon: "Profile"   },
  { href: "/account/security",       label: "Security",  icon: "Shield"    },
  { href: "/verification",           label: "Verification", icon: "Verify" },
  { href: "/notifications",          label: "Notifications", icon: "Bell"   },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const balance  = useTradeStore((s) => s.balance);
  const realtimeBalance = useTradeStore((s) => s.realtimeBalanceUsdt);
  const setMode = useTradeStore((s) => s.setMode);
  const setSymbol = useTradeStore((s) => s.setSymbol);
  const series   = useTradeStore((s) => s.series);
  const symbol   = useTradeStore((s) => s.selectedSymbol);
  const storeUser = useTradeStore((s) => s.user);
  const auth = useAuth();
  const user = auth.user ? {
    name: auth.user.name ?? auth.user.email ?? "Trader",
    email: auth.user.email ?? "",
    phone: storeUser?.phone ?? "",
    kyc: storeUser?.kyc ?? "Unverified" as const,
    joinedAt: storeUser?.joinedAt ?? 0,
  } : storeUser;
  const mode    = useTradeStore((s) => s.mode);
  const coll    = useTradeStore((s) => s.sidebarCollapsed);
  const toggle  = useTradeStore((s) => s.toggleSidebar);
  const setColl = useTradeStore((s) => s.setSidebarCollapsed);
  const unread   = useTradeStore((s) => s.notifications.filter(n => !n.read).length);
  const tickAll  = useTradeStore((s) => s.tickAll);
  const tickWd   = useTradeStore((s) => s.tickWithdrawals);

  // Auto-collapse on narrow viewports
  useEffect(() => {
    function onResize() { if (window.innerWidth < 1024) setColl(true); else setColl(false); }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setColl]);

  // Live ticks (defensive — layout also drives them)
  useEffect(() => {
    const t = setInterval(() => { tickAll(); tickWd(); }, 500);
    return () => clearInterval(t);
  }, [tickAll, tickWd]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-bg-900/95 border-b border-line">
        <div className="px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={toggle}
                  className="press p-1.5 rounded hover:bg-bg-800 text-muted hover:text-ink"
                  aria-label="Toggle sidebar">
            <Icon.Menu size={18} />
          </button>
          <Link href="/" className="press flex items-center gap-2 shrink-0">
            <Logo size={28} withWord={false} />
            <span className="font-display font-semibold tracking-[0.18em] text-[15px] leading-none hidden sm:inline">LUMORA</span>
          </Link>
          {mode === "guest" && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber/40 bg-amber/5 text-amber text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse-soft" /> Demo mode
            </span>
          )}
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            {mode === "real" && (
              <>
                <Link href="/wallet/deposit"
                      className="press hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green text-bg-950 text-xs font-semibold hover:bg-green-bright animate-pulse-soft">
                  <Icon.Plus size={14} /> Deposit
                </Link>
                <Link href="/wallet/withdraw"
                      className="press hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs hover:border-green-bright">
                  <Icon.ArrowUp size={14} className="rotate-180" /> Withdraw
                </Link>
                <Link href="/wallet/deposit"
                      aria-label="Deposit"
                      className="press sm:hidden grid place-items-center w-8 h-8 rounded-md bg-green text-bg-950 hover:bg-green-bright">
                  <Icon.Plus size={14} />
                </Link>
                <Link href="/wallet/withdraw"
                      aria-label="Withdraw"
                      className="press sm:hidden grid place-items-center w-8 h-8 rounded-md border border-line text-ink hover:border-green-bright">
                  <Icon.ArrowUp size={14} className="rotate-180" />
                </Link>
              </>
            )}
            <Link href="/wallet" className="hidden sm:flex items-center gap-2 text-sm ml-1">
              <span className="text-muted">Balance</span>
              <span className="font-semibold tabular-nums">{usdt(realtimeBalance ?? balance)}</span>
            </Link>
            <ThemeToggle />
            <Link href="/notifications" className="relative press px-2 py-1 text-muted hover:text-ink"
                  aria-label="Notifications">
              <Icon.Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-green text-bg-950 rounded-full w-4 h-4 grid place-items-center font-semibold animate-pulse-soft">
                  {Math.min(unread, 9)}
                </span>
              )}
            </Link>
            {!auth.configured && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber/40 bg-amber/5 text-amber text-[11px]">
                <Icon.Lock size={12} /> Firebase keys missing
              </span>
            )}
            <AccountDropdown />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar — desktop */}
        <aside
          aria-label="Navigation"
          className={`hidden lg:flex shrink-0 border-r border-line bg-bg-900 flex-col overflow-hidden transition-[width,opacity] duration-300 ease-out ${coll ? "w-[68px]" : "w-[260px]"}`}
        >
          <div className="px-3 py-4 flex-1 overflow-y-auto scrollbar-thin">
            <SidebarSection title="Markets" collapsed={coll}>
              {ASSETS.map(a => {
                const last = series[a.symbol]?.candles?.[series[a.symbol].candles.length - 1]?.close ?? a.basePrice;
                const active = symbol === a.symbol;
                return (
                  <SidebarRow key={a.symbol} active={active} collapsed={coll}
                              onClick={() => setSymbol(a.symbol)}
                              icon={active ? "ArrowR" : "ChevR"}
                              title={a.display}
                              sub={last.toFixed(a.decimals)} />
                );
              })}
            </SidebarSection>

            <SidebarSection title="Pages" collapsed={coll}>
              {NAV.map(n => {
                const active = pathname === n.href || pathname?.startsWith(n.href + "/");
                const Comp = Icon[n.icon] as React.FC<any>;
                return (
                  <SidebarLink key={n.href} href={n.href} active={active} collapsed={coll}
                               icon={<Comp size={16} />} label={n.label} />
                );
              })}
            </SidebarSection>

            <SidebarSection title="Account" collapsed={coll}>
              <SidebarLink href="/legal"   active={pathname === "/legal"}   collapsed={coll} icon={<Icon.Shield  size={16} />} label="Risk & Legal" />
              <SidebarLink href="/privacy" active={pathname === "/privacy"} collapsed={coll} icon={<Icon.Lock    size={16} />} label="Privacy" />
              <li>
                <SignOutLink collapsed={coll} label="Log out" />
              </li>
            </SidebarSection>
          </div>

          <div className="px-3 py-3 border-t border-line text-[11px] text-muted flex items-center gap-2">
            <button onClick={toggle}
                    className={`press p-1 rounded hover:bg-bg-800 ${coll ? "mx-auto" : ""}`}
                    aria-label="Collapse sidebar">
              <Icon.ChevL size={14} />
            </button>
            {!coll && <span>Demo · No real funds at risk</span>}
          </div>
        </aside>

        {/* Hover-to-expand when collapsed */}
        {coll && (
          <div
            onMouseEnter={() => setColl(false)}
            className="hidden lg:block fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-3 z-30" />
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-900 border-t border-line">
        <div className="grid grid-cols-4 text-xs">
          <MobileNavLink href="/dashboard" active={pathname?.startsWith("/dashboard") ?? false} label="Home"    icon={<Icon.Logo size={16} />} />
          <MobileNavLink href="/markets"   active={pathname?.startsWith("/markets")   ?? false} label="Markets" icon={<Icon.Markets size={16} />} />
          <MobileNavLink href="/trade"     active={pathname?.startsWith("/trade")     ?? false} label="Trade"   icon={<Icon.Trade size={16} />} accent />
          <MobileNavLink href="/wallet"    active={pathname?.startsWith("/wallet")    ?? false} label="Wallet"  icon={<Icon.Wallet size={16} />} />
        </div>
      </nav>

      <AuthSyncBridge />
      <SupabaseSyncMount />
      <Toasts />
    </div>
  );
}

function SupabaseSyncMount() {
  useSupabaseSync();
  return null;
}

function SidebarSection({ title, collapsed, children }: { title: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {!collapsed && (
        <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-muted mb-2">{title}</p>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarLink({ href, active, collapsed, icon, label }: { href: string; active: boolean; collapsed: boolean; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link href={href}
            title={collapsed ? label : undefined}
            className={`press flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors
                        ${active ? "bg-bg-800 text-ink" : "text-muted hover:text-ink hover:bg-bg-800/60"}
                        ${collapsed ? "justify-center" : ""}`}>
        <span className="shrink-0">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
}

function SidebarRow({ active, collapsed, onClick, icon, title, sub }: { active: boolean; collapsed: boolean; onClick: () => void; icon: keyof typeof Icon; title: string; sub?: string }) {
  const Comp = Icon[icon] as React.FC<any>;
  return (
    <li>
      <button onClick={onClick}
              title={collapsed ? title : undefined}
              className={`press w-full flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors
                          ${active ? "bg-green/10 text-green border border-green/30" : "text-muted hover:text-ink hover:bg-bg-800/60 border border-transparent"}
                          ${collapsed ? "justify-center" : ""}`}>
        <Comp size={14} />
        {!collapsed && (
          <>
            <span className="truncate">{title}</span>
            {sub && <span className="ml-auto text-[10px] font-mono text-muted">{sub}</span>}
          </>
        )}
      </button>
    </li>
  );
}

function MobileNavLink({ href, active, label, icon, accent }: { href: string; active: boolean; label: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Link href={href}
          className={`press py-2.5 flex flex-col items-center justify-center gap-0.5
                      ${active ? (accent ? "text-green" : "text-ink") : "text-muted hover:text-ink"}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
