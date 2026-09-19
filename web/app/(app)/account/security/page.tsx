"use client";
import { useState } from "react";

export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [withdrawPin, setWithdrawPin] = useState(true);
  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-muted text-sm mt-1">Keep your account safe.</p>
      </div>
      <Card title="Password">
        <p className="text-xs text-muted">Last changed 12 days ago.</p>
        <button className="mt-3 px-3 py-1.5 rounded border border-line text-sm hover:border-green-bright">Change password</button>
      </Card>
      <Card title="Phone verification">
        <ToggleRow on={phoneVerified} setOn={setPhoneVerified} label="Verify my phone number" desc="Receive login alerts and confirm withdrawals." />
      </Card>
      <Card title="Two-factor authentication">
        <ToggleRow on={twoFA} setOn={setTwoFA} label="Use 2FA on every login" desc="Adds a 6-digit code from your authenticator app." />
      </Card>
      <Card title="Withdrawal security">
        <ToggleRow on={withdrawPin} setOn={setWithdrawPin} label="Require a 4-digit PIN for withdrawals" desc="Adds a step before each withdrawal request." />
      </Card>
      <Card title="Login sessions">
        <p className="text-sm">This device · Chrome on Windows · Active now</p>
        <button className="mt-3 px-3 py-1.5 rounded border border-red/40 text-red text-sm hover:bg-red/10">Log out of all other devices</button>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-bg-900 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ToggleRow({ on, setOn, label, desc }: { on: boolean; setOn: (b: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <button onClick={() => setOn(!on)}
        className={`relative w-10 h-5 rounded-full transition ${on ? "bg-green" : "bg-bg-700 border border-line"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg-950 transition ${on ? "left-5" : "left-0.5"}`} />
      </button>
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted mt-1">{desc}</p>
      </div>
    </div>
  );
}
