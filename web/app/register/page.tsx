"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const [first, setFirst]   = useState("");
  const [last, setLast]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [pwd, setPwd]       = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  async function persistThenRoute(token: string, route: string) {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: (first + " " + last).trim() || email, phone }),
      });
    } catch { /* fall through */ }
    router.push(route);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first || !email || !pwd) { setErr("Please fill all required fields."); return; }
    setErr(null); setBusy(true);
    // signUpEmail → Firebase creates user → sendEmailVerification() is called.
    const m = await auth.signUpEmail(email, pwd, (first + " " + last).trim());
    if (m) { setBusy(false); setErr(m); return; }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    setBusy(false);
    if (!token) { router.push("/login"); return; }
    // Firebase sends the verification email inside signUpEmail. Persist the
    // profile (kyc still "Unverified") and route to /verify.
    await persistThenRoute(token, "/verify");
  }

  async function google() {
    setErr(null); setBusy(true);
    const r = await auth.signInGoogle();
    setBusy(false);
    if (!r.ok) { setErr(r.reason); return; }
    // Google accounts are email_verified=true by Firebase — straight to dashboard.
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    if (token) await persistThenRoute(token, "/dashboard");
  }

  return (
    <main className="min-h-screen bg-bg-950 flex items-center justify-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <Logo size={28} withWord={false} />
          <span className="font-display tracking-wide font-semibold">LUMORA</span>
        </Link>

        <div className="rounded-md border border-line bg-bg-900 p-6">
          <h1 className="font-display text-xl font-semibold">Create your Lumora account</h1>
          <p className="text-xs text-muted mt-1">Step 1 of 2 · Your details.</p>

          {!auth.configured && (
            <p className="mt-3 text-[11px] text-amber bg-amber/5 border border-amber/30 rounded p-2">
              Firebase is not configured yet — set <code>NEXT_PUBLIC_FIREBASE_*</code> in <code>.env.local</code>.
            </p>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-muted">First name</span>
                <input value={first} onChange={(e) => setFirst(e.target.value)} required
                  className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Last name</span>
                <input value={last} onChange={(e) => setLast(e.target.value)}
                  className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-muted">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Phone (optional)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="07xxxxxxxx"
                className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Password</span>
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" required minLength={6}
                className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
            </label>

            <button type="submit" disabled={busy || !auth.configured}
              className="w-full py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {busy ? <><Icon.Sparkle size={14} className="animate-pulse-soft" /> Creating…</> : "Create account"}
            </button>
          </form>
          <div className="mt-4 hairline" />
          <button onClick={google} disabled={busy || !auth.configured}
            className="press mt-4 w-full py-2.5 rounded border border-line text-sm hover:border-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path fill="#EA4335" d="M12 11v3.2h6.8c-.3 1.7-2 5-6.8 5-4.1 0-7.4-3.4-7.4-7.5S7.9 4.2 12 4.2c2.3 0 3.9 1 4.8 1.8l3.3-3.2C18 1 15.2-.2 12-.2 5.4-.2 0 5.1 0 12s5.4 12.2 12 12.2c6.9 0 11.5-4.8 11.5-11.7 0-.8-.1-1.4-.2-2H12z"/></svg>
            Sign up with Google
          </button>

          {err && <p className="mt-3 text-xs text-red">{err}</p>}

          <p className="mt-4 text-xs text-muted text-center">
            Already registered? <Link href="/login" className="text-green">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
