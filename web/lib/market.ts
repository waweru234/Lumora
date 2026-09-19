import type { Asset } from "./assets";

export type Candle = {
  start: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  live?: boolean;
  bucketMs: number;        // resolution of THIS candle (1m, 1H, 4H, 1D, …)
  src: "init" | "tick" | "rolled";
};

export type CandleSeries = {
  symbol: string;
  baseMs: number;          // primary in-memory resolution (1-minute)
  candles: Candle[];       // recent 1m base ≥ 1 minute
  extended: Candle[];      // coarser historic baseline (1H/4H/1D) up to ~120 days
  lastChange?: number;
  tp?: number;
};

export const BASE_MS = 60_000;
export const HOUR_MS = 60 * 60_000;
export const DAY_MS  = 24 * HOUR_MS;

const RECENT_MINUTES  =  6 * 60;          // 6 hours of 1-minute candles
const EXTENDED_1H_DAYS =  7;              // last 7 days at 1-hour resolution
const EXTENDED_4H_DAYS = 30;              // days 7-30 at 4-hour resolution
const EXTENDED_1D_DAYS = 120;             // days 30-120 at 1-day resolution

// ---------------------------------------------------------------------------
// Deterministic noise so reload + reload-from-cache produce the same shape.
// ---------------------------------------------------------------------------

function hash(n: number): number {
  let h = 0x811c9dc5 ^ Math.imul(n | 0, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0xffffffff;
}

function gauss(seed: number) {
  const u = Math.max(1e-9, hash(seed));
  const v = hash(seed + 7919);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round(n: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

// Drift a price one step; realistic random walk with momentum + mean-reversion
// + a session multiplier that's gentler at night, hotter during overlap hours.
function step(prev: number, asset: Asset, ctx: { lastChange: number; tp: number }, seed: number): { price: number; change: number } {
  const z = gauss(seed);
  const hour = new Date(seed).getUTCHours();
  const sessionBoost = (hour >= 12 && hour <= 16) ? 1.4 : (hour >= 0 && hour <= 7) ? 0.7 : 1.0;
  const noise = z * asset.spreadBps * (3.5 + asset.volatility * 9) * sessionBoost;
  const reversion = (asset.basePrice - prev) * 0.0008;
  const momentum = ctx.lastChange * 0.35;
  let next = prev + noise + reversion + momentum;
  const rail = asset.basePrice * 0.35;
  if (next > asset.basePrice + rail) next = asset.basePrice + rail - Math.abs(gauss(seed + 11)) * asset.spreadBps * 4;
  if (next < asset.basePrice - rail) next = asset.basePrice - rail + Math.abs(gauss(seed + 13)) * asset.spreadBps * 4;
  next = round(next, asset.decimals);
  return { price: next, change: next - prev };
}

// ---------------------------------------------------------------------------

function makeCandle(asset: Asset, start: number, bucketMs: number, open: number, seed: number): Candle {
  const ctx = { lastChange: 0, tp: seed };
  const w = step(open, asset, ctx, seed).price;
  const wickUp = Math.abs(gauss(seed + 31)) * asset.spreadBps * (1.2 + asset.volatility * 2.5);
  const wickDn = Math.abs(gauss(seed + 47)) * asset.spreadBps * (1.2 + asset.volatility * 2.5);
  const high = round(Math.max(open, w) + wickUp, asset.decimals);
  const low  = round(Math.min(open, w) - wickDn, asset.decimals);
  const close = round(w, asset.decimals);
  const volume = (Math.abs(gauss(seed + 71)) + 0.3) * 600 * (asset.volatility + 0.2);
  return { start, open: round(open, asset.decimals), high, low, close, volume, bucketMs, src: "init" as const };
}

export function initSeries(asset: Asset): CandleSeries {
  const now = Date.now();

  // 1-minute base, last RECENT_MINUTES minutes ending at the current 1m bucket.
  const cur1mBucket = Math.floor(now / BASE_MS) * BASE_MS;
  const total1m = RECENT_MINUTES;
  const start1mBucket = cur1mBucket - (total1m - 1) * BASE_MS;
  const candles: Candle[] = [];
  let prev = asset.basePrice;
  let lastChange1m = 0;
  // Seed by UTC date + symbol so each "day" starts the same on cold reload.
  const seedBase = (asset.symbol.charCodeAt(0) * 1009) ^ Math.floor(now / DAY_MS);
  for (let i = 0; i < total1m; i++) {
    const start = start1mBucket + i * BASE_MS;
    const isLive = i === total1m - 1;
    const seed = seedBase * 1009 + i;
    const op = prev;
    const c = makeCandle(asset, start, BASE_MS, op, seed);
    if (!isLive) {
      candles.push(c);
      prev = c.close;
      lastChange1m = c.close - c.open;
    } else {
      // Live candle: open = prev close, close = same (will be updated by ticks)
      candles.push({
        ...c,
        open: round(prev, asset.decimals),
        close: round(prev, asset.decimals),
        high: prev,
        low: prev,
        live: true,
        src: "init",
      });
    }
  }

  // Coarse historic candles spanning the past 120 days in three layers so the
  // 1H / 4H / 1D timeframes all have plenty of visible bars.
  const extended: Candle[] = [];
  let extPrev = asset.basePrice;

  // 1-day candles for the past EXTENDED_1D_DAYS days
  // We start from today and go backward.
  {
    const todayMidnight = Math.floor(now / DAY_MS) * DAY_MS;
    for (let d = EXTENDED_1D_DAYS - 1; d >= 0; d--) {
      const start = todayMidnight - d * DAY_MS;
      const isLast = d === 0;
      const seed = (asset.symbol.charCodeAt(0) * 7331 + d + start) | 0;
      const candleDay = makeCandle(asset, start, DAY_MS, extPrev, seed);
if (isLast) {
      // Make the last day "live" so it merges nicely with the recent 1m candles.
      extended.push({ ...candleDay, live: true, src: "init" });
    } else {
        extended.push(candleDay);
        extPrev = candleDay.close;
      }
      if (d === EXTENDED_4H_DAYS) extPrev = candleDay.close;
      if (d === EXTENDED_1H_DAYS) extPrev = candleDay.close;
    }
  }

  // 4-hour candles for days [EXTENDED_1H_DAYS, EXTENDED_4H_DAYS)
  // (We roll them out from extPrev forward.)
  {
    const todayMidnight = Math.floor(now / DAY_MS) * DAY_MS;
    const start4h = todayMidnight - EXTENDED_4H_DAYS * DAY_MS;
    for (let i = 0; i < (EXTENDED_4H_DAYS - EXTENDED_1H_DAYS) * 6; i++) {
      const start = start4h + i * 4 * HOUR_MS;
      const seed = (asset.symbol.charCodeAt(0) * 5393 + i + start) | 0;
      const c = makeCandle(asset, start, 4 * HOUR_MS, extPrev, seed);
      extended.push(c);
      extPrev = c.close;
    }
  }

  // 1-hour candles for days [0, EXTENDED_1H_DAYS) — last 7 days at 1H
  {
    const todayMidnight = Math.floor(now / DAY_MS) * DAY_MS;
    const startHour = todayMidnight - EXTENDED_1H_DAYS * DAY_MS;
    const hours = EXTENDED_1H_DAYS * 24;
    for (let i = 0; i < hours; i++) {
      const start = startHour + i * HOUR_MS;
      const seed = (asset.symbol.charCodeAt(0) * 1493 + i + start) | 0;
      const c = makeCandle(asset, start, HOUR_MS, extPrev, seed);
      extended.push(c);
      extPrev = c.close;
    }
  }

  extended.sort((a, b) => a.start - b.start);

  return {
    symbol: asset.symbol,
    baseMs: BASE_MS,
    candles,
    extended,
    lastChange: lastChange1m,
    tp: seedBase,
  };
}

export function nextTick(s: CandleSeries, asset: Asset): CandleSeries {
  const candles = s.candles.slice();
  const idx = candles.length - 1;
  const cur = { ...candles[idx] };

  // The live candle moves by deterministic time-since-bucket. Every client
  // on the planet sees the same value at the same wall-clock millisecond
  // (no Math.random() in this path), which is what makes the chart globally
  // consistent without any backend coordination.
  const now = Date.now();
  const bucketStart = cur.start;
  const sub = Math.max(0, now - bucketStart);
  const seed = (asset.symbol.charCodeAt(0) * 1337) ^ bucketStart ^ sub;

  const ctx = { prev: cur.close, lastChange: s.lastChange ?? 0, tp: sub };
  const { price, change } = step(cur.close, asset, ctx, seed);
  cur.close = round(price, asset.decimals);
  if (cur.close > cur.high) cur.high = cur.close;
  if (cur.close < cur.low) cur.low  = cur.close;
  cur.volume += Math.abs(gauss(seed + 73)) * 80 + asset.volatility * 6;

  candles[idx] = cur;
  return { ...s, candles, lastChange: change, tp: sub };
}

export function rollCandle(s: CandleSeries, _asset: Asset): CandleSeries {
  const now = Date.now();
  const cur1mBucket = Math.floor(now / BASE_MS) * BASE_MS;
  const candles = s.candles.slice();
  if (s.candles[s.candles.length - 1].start < cur1mBucket) {
    candles[candles.length - 1] = { ...candles[candles.length - 1], live: false };
    candles.push({
      start: cur1mBucket, open: candles[candles.length - 1].close,
      high: candles[candles.length - 1].close, low: candles[candles.length - 1].close,
      close: candles[candles.length - 1].close, volume: 0,
      bucketMs: BASE_MS, live: true, src: "rolled",
    });
    while (candles.length > RECENT_MINUTES + 4) candles.shift();
  }

  // Extend the daily live candle across day boundaries.
  const curDayBucket = Math.floor(now / DAY_MS) * DAY_MS;
  const lastDay = s.extended[s.extended.length - 1];
  if (lastDay?.start < curDayBucket) {
    const extended = s.extended.slice();
    extended[extended.length - 1] = { ...lastDay, live: false };
    extended.push({
      start: curDayBucket,
      open: lastDay.close, high: lastDay.close, low: lastDay.close, close: lastDay.close,
      volume: 0, bucketMs: DAY_MS, live: true, src: "rolled",
    });
    while (extended.length > EXTENDED_1D_DAYS * 1.2) extended.shift();
    return { ...s, candles, extended, lastChange: 0 };
  }

  return { ...s, candles, lastChange: 0 };
}

// Aggregate either the 1-minute base or the coarse extended history.
// For 1H / 4H / 1D we use the pre-built extended[] directly; for finer
// buckets we aggregate the recent 1-minute candles.
export function aggregateCandles(s: CandleSeries, targetMs: number): Candle[] {
  if (targetMs === BASE_MS) return s.candles;
  if (targetMs === HOUR_MS || targetMs === 4 * HOUR_MS || targetMs === DAY_MS) {
    const direct = (s.extended || []).filter(c => c.bucketMs === targetMs);
    if (direct.length) return direct;
    // Fallback: roll 1-minute candles up into the target bucket so older
    // persisted states (without `extended`) still produce visible bars.
    return aggregateBase(s.candles, targetMs);
  }
  // Fallback: aggregate the 1-minute base into whatever the user wants.
  return aggregateBase(s.candles, targetMs);
}

function aggregateBase(candles: Candle[], targetMs: number): Candle[] {
  const out: Candle[] = [];
  let bucket: Candle | null = null;
  for (const c of candles) {
    const start = Math.floor(c.start / targetMs) * targetMs;
    if (!bucket || bucket.start !== start) {
      if (bucket) out.push(bucket);
      bucket = {
        start, open: c.open, high: c.high, low: c.low, close: c.close,
        volume: c.volume, bucketMs: targetMs, src: "init" as const,
      };
    } else {
      if (c.high > bucket.high) bucket.high = c.high;
      if (c.low  < bucket.low)  bucket.low  = c.low;
      bucket.close = c.close;
      bucket.volume += c.volume;
    }
  }
  if (bucket) out.push(bucket);
  return out;
}
