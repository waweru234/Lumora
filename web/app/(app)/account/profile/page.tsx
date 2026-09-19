"use client";
import { useState, useEffect } from "react";
import { useTradeStore } from "@/store/useTradeStore";

export default function ProfilePage() {
  const user = useTradeStore((s) => s.user);
  const login = useTradeStore((s) => s.login);
  const logout = useTradeStore((s) => s.logout);
  const [first, setFirst] = useState(user?.name?.split(" ")[0] ?? "");
  const [last, setLast]   = useState(user?.name?.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  useEffect(() => {
    setFirst(user?.name?.split(" ")[0] ?? "");
    setLast(user?.name?.split(" ").slice(1).join(" ") ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  function save() {
    login((first + " " + last).trim() || "Trader", email);
    if (phone || user) useTradeStore.setState({ user: { ...(user as any), phone } });
  }

  return (
    <div className="px-4 lg:px-6 py-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted text-sm mt-1">Your account details.</p>
      </div>

      <div className="rounded-md border border-line bg-bg-900 p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="First name" value={first} onChange={setFirst} />
          <Field label="Last name"  value={last}  onChange={setLast}  />
        </div>
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
        <div className="pt-2 flex gap-2">
          <button onClick={save} className="px-4 py-2 rounded bg-green text-bg-950 text-sm font-semibold hover:bg-green-bright">Save changes</button>
          <button onClick={logout} className="px-4 py-2 rounded border border-line text-sm hover:border-red text-red">Log out</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-bg-800 border border-line rounded px-3 py-2 text-sm ring-focus" />
    </label>
  );
}
