"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-bg-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <Logo /><span className="font-semibold tracking-wide">LUMORA</span>
        </Link>
        <div className="rounded-md border border-line bg-bg-900 p-6">
          <h1 className="text-xl font-semibold">Reset your password</h1>
          <p className="text-xs text-muted mt-1">We'll send a reset link to your email.</p>
          {sent ? (
            <p className="mt-4 text-sm">If that email is registered, a reset link is on its way.</p>
          ) : (
            <>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"
                className="mt-4 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
              <button onClick={() => setSent(true)} className="mt-3 w-full py-2.5 rounded bg-green text-bg-950 font-semibold hover:bg-green-bright">Send reset link</button>
            </>
          )}
          <p className="mt-4 text-xs text-muted text-center">
            <Link href="/login" className="text-green">Back to log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
