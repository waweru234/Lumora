"use client";
import Link from "next/link";
import { useTradeStore } from "@/store/useTradeStore";

export function TryDemoLink() {
  return (
    <Link
      href="/login"
      onClick={() => useTradeStore.getState().setMode("guest")}
      className="press px-5 py-3 rounded-md border border-line text-ink text-sm hover:border-green-bright inline-flex items-center justify-center gap-2"
    >
      <span>▶</span>
      Try demo as guest
    </Link>
  );
}
