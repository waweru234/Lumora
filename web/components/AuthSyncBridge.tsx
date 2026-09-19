"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTradeStore } from "@/store/useTradeStore";

export function AuthSyncBridge() {
  const auth = useAuth();
  const setUser = useTradeStore((s) => s.login);
  const reset   = useTradeStore((s) => s.resetDemo);

  useEffect(() => {
    if (auth.user) {
      setUser(auth.user.name ?? auth.user.email ?? "Trader", auth.user.email ?? "");
    }
  }, [auth.user?.uid, auth.user?.email, auth.user?.name, setUser]);

  return null;
}
