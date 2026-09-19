"use client";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useTradeStore } from "@/store/useTradeStore";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const tickAll = useTradeStore((s) => s.tickAll);
  const tickWithdrawals = useTradeStore((s) => s.tickWithdrawals);
  const expirePending = useTradeStore((s) => s.expirePendingDeposits);

  useEffect(() => {
    const t = setInterval(() => { tickAll(); tickWithdrawals(); }, 500);
    return () => clearInterval(t);
  }, [tickAll, tickWithdrawals]);

  // Cron: every 10s check for deposit rows older than 60s that haven't been
  // confirmed → mark Failed with notification.
  useEffect(() => {
    const id = setInterval(() => { expirePending(); }, 10_000);
    return () => clearInterval(id);
  }, [expirePending]);

  return <AppShell>{children}</AppShell>;
}
