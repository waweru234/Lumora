export function fmtPrice(n: number, decimals = 5): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtUsdt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}

export function fmtMs(ms: number): string {
  if (ms < 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function fmtTime(t: number): string {
  return new Date(t).toLocaleTimeString();
}
