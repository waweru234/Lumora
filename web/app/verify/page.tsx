"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { LoaderLogo } from "@/components/Loader";

type Phase = "checking" | "waiting" | "resent" | "ok" | "error";

export default function VerifyPage() {
  const router  = useRouter();
  const auth    = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [msg,   setMsg]   = useState<string | null>(null);

  // Auto-polling: every 4 seconds, ask Firebase to reload and check
  // email_verified. As soon as it's true, hit the server and route to /dashboard.
  useEffect(() => {
    if (!auth.user) return;
    let cancelled = false;
    async function tick() {
      const verified = await auth.reloadVerification();
      if (cancelled) return;
      if (verified) {
        await auth.markVerified();
        if (cancelled) return;
        setPhase("ok");
        setMsg("Email verified. Loading your account…");
        router.push("/dashboard");
      } else {
        setPhase("waiting");
        setMsg("We sent a verification link to your inbox. Open it on this device to continue.");
      }
    }
    tick();
    const t = setInterval(tick, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [auth, router]);

  async function manualVerify() {
    setPhase("checking");
    const verified = await auth.reloadVerification();
    if (verified) {
      await auth.markVerified();
      setPhase("ok");
      setMsg("Email verified. Loading your account…");
      router.push("/dashboard");
    } else {
      setPhase("waiting");
      setMsg("Still waiting. Open the link we sent and try again.");
    }
  }

  async function resend() {
    setPhase("checking");
    const ok = await auth.sendVerification();
    if (ok) {
      setPhase("resent");
      setMsg("Verification email re-sent. Check your inbox (and spam).");
    } else {
      setPhase("error");
      setMsg("Could not re-send. Make sure you are signed in and try again.");
    }
  }

  const email = auth.user?.email ?? "your email";

  return (
    <main className="min-h-screen bg-bg-950 flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <Logo size={28} withWord={false} />
          <span className="font-display tracking-wide font-semibold">LUMORA</span>
        </Link>

        <div className="rounded-md border border-line bg-bg-900 p-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-green">Step 2 of 2 · Verify your email</p>
          <h1 className="font-display text-xl font-semibold mt-1">Check your inbox</h1>
          <p className="text-sm text-muted mt-2">
            We sent a verification link to <span className="text-ink">{email}</span>.
            Open it on this device and your account is ready.
          </p>

          <div className="mt-4 rounded-md border border-line bg-bg-800/40 px-4 py-3 text-sm">
            {phase === "checking" ? (
              <div className="flex items-center gap-3">
                <LoaderLogo size={36} label="" />
                <span>Checking with Firebase…</span>
              </div>
            ) : (
              <p className={phase === "ok" ? "text-green" : phase === "error" ? "text-red" : "text-ink"}>{msg}</p>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button onClick={manualVerify} disabled={phase === "checking"}
                    className="press flex-1 py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {phase === "checking"
                ? <><Icon.Sparkle size={14} className="animate-pulse-soft" /> Checking…</>
                : <><Icon.Check size={14} /> I have verified</>}
            </button>
            <button onClick={resend}
                    className="press flex-1 py-2.5 rounded border border-line text-sm hover:border-green-bright inline-flex items-center justify-center gap-2">
              <Icon.Mail size={14} /> Resend email
            </button>
          </div>

          <p className="mt-4 text-[11px] text-muted">
            Don't see it? Check spam, or wait 30 s — Firebase can take a moment to deliver. Closing this tab will sign you out.
          </p>

          <div className="hairline my-4" />
          <Link href="/login" className="text-xs text-muted hover:text-ink">← Back to log in</Link>
        </div>
      </div>
    </main>
  );
}
