"use client";
import { useState } from "react";
import { useTradeStore } from "@/store/useTradeStore";

export default function VerificationPage() {
  const user = useTradeStore((s) => s.user);
  const [step, setStep] = useState(1);

  const updateUser = (patch: any) => useTradeStore.setState({ user: { ...(user as any), ...patch } });

  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Account verification</h1>
      <p className="text-muted text-sm mt-1">Verify your identity to unlock larger deposits and withdrawals.</p>

      <div className="mt-5 rounded-md border border-line bg-bg-900 p-5 space-y-3">
        <Step n={1} active={step >= 1} current={step === 1}
              title="Phone" desc="Confirm your phone with an SMS code."
              onStart={() => setStep(2)}
              done={user?.phone ? true : false} />
        <Step n={2} active={step >= 2} current={step === 2}
              title="ID document" desc="Upload a clear photo of your national ID or passport."
              onStart={() => { updateUser({ kyc: "Pending" }); setStep(3); }}
              done={user?.kyc === "Verified" || user?.kyc === "Pending"} />
        <Step n={3} active={step >= 3} current={step === 3}
              title="Selfie" desc="Take a selfie holding your ID."
              onStart={() => { updateUser({ kyc: "Verified" }); setStep(4); }}
              done={user?.kyc === "Verified"} />
      </div>

      <p className="text-xs text-muted mt-4">
        For a real-money service, the appropriate identity, age and KYC requirements are determined by the applicable regulatory framework and your licensed payment/compliance providers.
      </p>
    </div>
  );
}

function Step({ n, title, desc, active, current, onStart, done }:
  { n: number; title: string; desc: string; active: boolean; current: boolean; onStart: () => void; done: boolean }) {
  return (
    <div className={`rounded border p-4 flex items-start gap-3 ${active ? "border-green/40 bg-green/5" : "border-line"}`}>
      <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${done ? "bg-green text-bg-950" : "bg-bg-800 text-muted"}`}>
        {done ? "✓" : n}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted mt-0.5">{desc}</p>
        {current && (
          <button onClick={onStart} className="mt-2 px-3 py-1.5 rounded bg-green text-bg-950 text-xs font-semibold hover:bg-green-bright">Start this step</button>
        )}
      </div>
    </div>
  );
}
