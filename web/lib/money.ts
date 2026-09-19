import { useTradeStore } from "@/store/useTradeStore";

export function kes(n: number): string {
  return n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

export function usdt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}

export function sign(n: number): string {
  return n >= 0 ? "+" : "−";
}
