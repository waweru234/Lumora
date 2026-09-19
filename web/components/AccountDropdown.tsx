"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTradeStore } from "@/store/useTradeStore";
import { Icon } from "@/components/Icon";
import { signOutAndRedirect } from "@/components/SignOutLink";

export function AccountDropdown() {
  const auth = useAuth();
  const router = useRouter();
  const unread = useTradeStore((s) => s.notifications.filter(n => !n.read).length);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current) return;
      if (!wrap.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const name  = auth.user?.name ?? auth.user?.email ?? "Guest";
  const email = auth.user?.email ?? "Demo session";
  const photo = auth.user?.picture;
  const initials = (name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join("") || "?").toUpperCase();

  function signOutNow() {
    setOpen(false);
    // Delegate to SignOutLink's central procedure so the store is cleared
    // and the user is routed to the main page.
    void signOutAndRedirect(router);
  }

  return (
    <div ref={wrap} className="relative">
      <button onClick={() => setOpen(o => !o)}
              className={`press flex items-center gap-2 px-2 py-1.5 rounded-md border border-line hover:border-green-bright transition ${
                auth.configured ? "" : "border-amber/40"
              }`}
              aria-haspopup="menu" aria-expanded={open}>
        <span className="w-7 h-7 rounded-full bg-bg-700 grid place-items-center text-[10px] font-semibold overflow-hidden border border-line/60">
          {photo
            ? <Image url={photo} />
            : <span>{initials}</span>}
        </span>
        <span className="hidden sm:inline text-sm">{name}</span>
        <Icon.ChevD size={12} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 rounded-md border border-line bg-bg-900 shadow-2xl z-50 origin-top-right animate-fade-in py-2">
          <div className="px-4 py-2 border-b border-line">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-muted truncate">{email}</p>
          </div>

          <ul className="py-1 text-sm">
            <MenuItem href="/account/profile"     icon={<Icon.Profile size={14} />} label="Profile"        onClick={() => setOpen(false)} />
            <MenuItem href="/account/security"    icon={<Icon.Shield  size={14} />} label="Security"       onClick={() => setOpen(false)} />
            <MenuItem href="/verification"        icon={<Icon.Verify  size={14} />} label="Verification"   onClick={() => setOpen(false)} />
            <MenuItemWithBadge
              href="/notifications" icon={<Icon.Bell size={14} />} label="Notifications" badge={unread}
              onClick={() => { setOpen(false); useTradeStore.getState().markNotificationsRead(); }}
            />
            <MenuItem href="/wallet"              icon={<Icon.Wallet  size={14} />} label="Wallet"         onClick={() => setOpen(false)} />
            <MenuItem href="/history"             icon={<Icon.History size={14} />} label="Trade history"  onClick={() => setOpen(false)} />
            <li className="hairline-x h-px my-1 mx-2" />
            <MenuItem href="/legal"               icon={<Icon.Shield  size={14} />} label="Risk & legal"   onClick={() => setOpen(false)} />
            <MenuItem href="/privacy"             icon={<Icon.Lock    size={14} />} label="Privacy"        onClick={() => setOpen(false)} />
          </ul>

          <div className="hairline my-1" />
          <button onClick={signOutNow}
                  className="press mx-2 mb-1 flex items-center gap-2 px-3 py-2 text-sm rounded text-red hover:bg-red/10 w-[calc(100%-16px)]">
            <Icon.Logout size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <li>
      <Link href={href} onClick={onClick}
            className="press flex items-center gap-3 px-4 py-2 hover:bg-bg-800/60 text-ink">
        <span className="text-muted">{icon}</span>
        <span>{label}</span>
      </Link>
    </li>
  );
}

function MenuItemWithBadge({ href, icon, label, badge, onClick }: { href: string; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <li>
      <Link href={href} onClick={onClick}
            className="press flex items-center gap-3 px-4 py-2 hover:bg-bg-800/60 text-ink">
        <span className="text-muted">{icon}</span>
        <span className="flex-1">{label}</span>
        {badge && badge > 0 && (
          <span className="text-[10px] bg-green text-bg-950 rounded-full px-1.5 font-semibold">
            {Math.min(badge, 99)}
          </span>
        )}
      </Link>
    </li>
  );
}

function Image({ url }: { url: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-full h-full object-cover" />;
}
