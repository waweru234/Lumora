"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTradeStore } from "@/store/useTradeStore";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function persistProfile(token: string) {
    try {
      await fetch("/api/profile", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch { /* non-fatal */ }
  }

  async function goToDashboard() {
    useTradeStore.getState().setMode("real");
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    if (token) await persistProfile(token);
    router.push("/dashboard");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pwd) return;
    setErr(null); setBusy(true);
    const r = await auth.signInEmail(email, pwd);
    setBusy(false);
    if (!r.ok) { setErr(r.reason); return; }
    // r.verified=false → user has not clicked the email link yet.
    if (!r.verified) { router.push("/verify?pending=1"); return; }
    await goToDashboard();
  }

  async function google() {
    setErr(null); setBusy(true);
    const r = await auth.signInGoogle();
    setBusy(false);
    if (!r.ok) { setErr(r.reason); return; }
    // Google accounts are auto email_verified.
    await goToDashboard();
  }

  function continueAsGuest() {
    useTradeStore.getState().setMode("guest");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-bg-950 flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <Logo size={28} withWord={false} />
          <span className="font-display tracking-wide font-semibold">LUMORA</span>
        </Link>

        <div className="rounded-md border border-line bg-bg-900 p-6">
          <h1 className="font-display text-xl font-semibold">Log in</h1>
          <p className="text-xs text-muted mt-1">Use your email and password, or continue with Google.</p>

          {!auth.configured && (
            <p className="mt-3 text-[11px] text-amber bg-amber/5 border border-amber/30 rounded p-2">
              Firebase is not configured yet — set <code>NEXT_PUBLIC_FIREBASE_*</code> in <code>.env.local</code>.
            </p>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Password</span>
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" required
                className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
            </label>
            <button type="submit" disabled={busy || !auth.configured}
              className="press w-full py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {busy ? <><Icon.Sparkle size={14} className="animate-pulse-soft" /> Signing in…</> : "Log in with email"}
            </button>
          </form>

          <div className="mt-4 hairline" />
          <button onClick={google} disabled={busy || !auth.configured}
            className="press mt-4 w-full py-2.5 rounded border border-line text-sm hover:border-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path fill="#EA4335" d="M12 11v3.2h6.8c-.3 1.7-2 5-6.8 5-4.1 0-7.4-3.4-7.4-7.5S7.9 4.2 12 4.2c2.3 0 3.9 1 4.8 1.8l3.3-3.2C18 1 15.2-.2 12-.2 5.4-.2 0 5.1 0 12s5.4 12.2 12 12.2c6.9 0 11.5-4.8 11.5-11.7 0-.8-.1-1.4-.2-2H12z"/></svg>
            Continue with Google
          </button>

          {err && <p className="mt-3 text-xs text-red">{err}</p>}

          <p className="mt-4 text-xs text-muted text-center">
            New here? <Link href="/register" className="text-green">Create an account</Link>
          </p>
          <p className="mt-1 text-xs text-muted text-center">
            <Link href="/forgot-password" className="hover:text-ink">Forgot your password?</Link>
          </p>
        </div>

        <div className="mt-6 rounded-md border border-line bg-bg-900 p-4">
          <p className="text-xs text-muted mb-2">Don’t want to sign in?</p>
          <button onClick={continueAsGuest} type="button"
                  className="press w-full py-2 rounded border border-line text-sm hover:border-green-bright inline-flex items-center justify-center gap-2">
            <Icon.User size={14} /> Continue as guest · play demo trades
          </button>
          <p className="mt-2 text-[11px] text-muted text-center">
            Guest mode lets you simulate trades with virtual funds. To deposit real money, sign in.
          </p>
        </div>
      </div>
    </main>
  );
}
