"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/admin",            label: "Overview" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/deposits",    label: "Deposits" },
  { href: "/admin/users",       label: "Users" },
  { href: "/admin/kyc",         label: "KYC" },
  { href: "/admin/markets",     label: "Markets" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-bg-950 text-ink flex flex-col">
      <header className="bg-bg-900 border-b border-line">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2"><Logo /><span className="font-semibold tracking-wide">LUMORA ADMIN</span></Link>
          <span className="ml-2 px-2 py-0.5 rounded bg-amber/10 text-amber text-[11px]">Internal</span>
          <Link href="/dashboard" className="ml-auto text-xs text-muted hover:text-ink">← Back to user view</Link>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 border-r border-line bg-bg-900 px-3 py-4 text-sm">
          <ul className="space-y-1">
            {NAV.map(n => {
              const active = pathname === n.href;
              return (
                <li key={n.href}>
                  <Link href={n.href}
                    className={`block px-3 py-2 rounded ${active ? "bg-bg-800 text-ink" : "text-muted hover:text-ink"}`}>
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
