export const DURATIONS: { label: string; ms: number }[] = [
  { label: "30s", ms: 30_000 },
  { label: "1m",  ms: 60_000 },
  { label: "2m",  ms: 120_000 },
  { label: "5m",  ms: 300_000 },
];

export function payoutOnWin(stake: number, payoutPct = 0.85): number {
  return round2(stake * payoutPct);
}

export function stakeValid(stake: number, balance: number): string | null {
  if (!Number.isFinite(stake)) return "Enter a stake amount";
  if (stake < 1) return "Minimum stake is 1 USDT";
  if (stake > 10_000) return "Maximum stake is 10,000 USDT";
  if (stake > balance) return "Stake exceeds your balance";
  return null;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
