"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useTradeStore } from "@/store/useTradeStore";
import { supabaseConfigured, getSupabaseBrowser } from "@/lib/supabase-browser";

/** Plain procedure — clears the local store + signs out + pushes to "/". */
export async function signOutAndRedirect(router: { push: (href: string) => unknown }) {
  if (typeof window === "undefined") return;
  // 1) Reset local demo state.
  useTradeStore.getState().resetDemo();
  useTradeStore.getState().setMode("guest");
  useTradeStore.setState({ realtimeBalanceUsdt: null, lastTradeId: null });

  // 2) Wipe persisted user-bound data.
  try {
    const persisted = JSON.parse(window.localStorage.getItem("lumora-trade-v2") || "{}");
    if (persisted && persisted.state) {
      persisted.state.user = null;
      persisted.state.mode = "guest";
      persisted.state.transactions = [];
      persisted.state.withdrawals = [];
      window.localStorage.setItem("lumora-trade-v2", JSON.stringify(persisted));
    }
  } catch {}

  // 3) Supabase browser signout (best-effort).
  try {
    if (supabaseConfigured()) {
      const sb = getSupabaseBrowser();
      if (sb && sb.auth && typeof sb.auth.signOut === "function") {
        await sb.auth.signOut();
      }
    }
  } catch {}

  // 4) Drop Firebase tokens.
  try { window.localStorage.removeItem("lumora-fb-token"); } catch {}
  try { window.sessionStorage.removeItem("lumora-fb-token"); } catch {}

  // 5) Sign out of Firebase.
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const a = getFirebaseAuth();
    if (a && a.currentUser) await a.signOut();
  } catch {}

  // 6) Main page.
  router.push("/");
}

export function SignOutLink({ collapsed = false, label = "Sign out" }: { collapsed?: boolean; label?: string }) {
  const router = useRouter();
  const onClick = useCallback(() => { void signOutAndRedirect(router); }, [router]);
  return (
    <button
      onClick={onClick}
      title={label}
      className={`press w-full flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors text-red hover:bg-red/10 ${collapsed ? "justify-center" : ""}`}
    >
      <Icon.Logout size={16} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

