-- 0002_market_candles.sql
-- Run this in Supabase Studio → SQL editor → New query, then "Run".
-- Idempotent.
--
-- This migration stores the *shared* market chart data so every Lumora user
-- sees the exact same line graph and candle history. Until a background
-- process is wired up that writes here every minute, the front-end
-- simulator will continue to compute candles deterministically locally
-- (see lib/market.ts) and the table remains empty. That is safe: the schema
-- is forward-compatible.
--
-- Composite primary key (symbol, timeframe, start) means each (1m/5m/...)
-- bucket of each pair is at most one row. New ticks for the same bucket
-- upsert in place; once the bucket closes (closed=true), the row is locked
-- and only volume may tick.

create extension if not exists "uuid-ossp";

create table if not exists public.market_symbols (
  symbol        text primary key,
  display       text not null,
  kind          text not null check (kind in ('forex','crypto','commodity')),
  base_price    numeric(18,6) not null,
  decimals      int  not null,
  spread_bps    numeric(18,6) not null,
  volatility    numeric(6,4)  not null,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.market_candles (
  symbol        text    not null references public.market_symbols(symbol) on delete cascade,
  timeframe     text    not null check (timeframe in ('1m','5m','15m','30m','1H','4H','1D')),
  start         timestamptz not null,                                          -- bucket start (UTC)
  open          numeric(18,6) not null,
  high          numeric(18,6) not null,
  low           numeric(18,6) not null,
  close         numeric(18,6) not null,
  volume        numeric(18,4) not null default 0,
  closed        boolean  not null default false,                              -- true once the bucket ends
  source        text     not null default 'sim',
  updated_at    timestamptz not null default now(),
  primary key (symbol, timeframe, start)
);

create index if not exists market_candles_sym_tf_start_idx
  on public.market_candles (symbol, timeframe, start desc);

create index if not exists market_candles_open_buckets_idx
  on public.market_candles (symbol, timeframe)
  where closed = false;

-- A tiny "live state" table that the front-end can poll *or* push to. The
-- chart subscribes to changes via Supabase Realtime if enabled; the polling
-- fallback reads the most recent open row per (symbol, timeframe).
create table if not exists public.market_ticks (
  symbol        text    not null,
  timeframe     text    not null,
  start         timestamptz not null,
  ts            timestamptz not null default now(),
  price         numeric(18,6) not null,
  source        text     not null default 'sim',
  primary key (symbol, timeframe, start, ts)
);
create index if not exists market_ticks_sym_tf_start_ts_idx
  on public.market_ticks (symbol, timeframe, start, ts desc);

-- ------------------------------------------------------------------ policies
-- RLS is off on user-data tables (see 0001_init) and we keep that here.
-- We rely on the server-side endpoints (with SUPABASE_SERVICE_ROLE_KEY) to
-- broker writes. If you'd rather have the client write directly with
-- publishable key, re-enable RLS with row security policies keyed by a
-- service_role JWT claim or you may also add a per-user policy and require
-- Firebase JWT verification.
alter table public.market_symbols  disable row level security;
alter table public.market_candles  disable row level security;
alter table public.market_ticks    disable row level security;

-- ------------------------------------------------------------------ API view
-- A flatLatestCandles view makes the live-candle poll cheap.
create or replace view public.market_latest_candle as
  select distinct on (symbol, timeframe)
    symbol, timeframe, start, open, high, low, close, volume, updated_at
  from public.market_candles
  where closed = false
  order by symbol, timeframe, start desc;

-- ------------------------------------------------------------------ seed
-- Bootstrap the symbol table with the same six markets that the front-end
-- already exposes. Idempotent — onConflict does nothing if the row exists.
insert into public.market_symbols (symbol, display, kind, base_price, decimals, spread_bps, volatility)
values
  ('EURUSD', 'EUR/USD', 'forex',     1.0864,    5, 0.0001, 0.28),
  ('GBPUSD', 'GBP/USD', 'forex',     1.2981,    5, 0.0001, 0.32),
  ('USDJPY', 'USD/JPY', 'forex',     149.34,    3, 0.01,   0.30),
  ('BTCUSD', 'BTC/USD', 'crypto',    63812.4,   2, 5,      0.62),
  ('ETHUSD', 'ETH/USD', 'crypto',    3402.7,    2, 1,      0.55),
  ('XAUUSD', 'XAU/USD', 'commodity', 2341.8,    2, 0.5,    0.40)
on conflict (symbol) do nothing;

-- ------------------------------------------------------------------ writer
-- Reference server-side code (production recommendation):
--
--   - A Vercel Cron / GitHub Action / Supabase Edge Function runs once per
--     minute. For each row in market_symbols, it computes the closed candle
--     for the *previous* minute, upserts into market_candles with closed=true.
--       INSERT ... ON CONFLICT (symbol, timeframe, start) DO UPDATE SET
--         high = greatest(high, excluded.high),
--         low  = least(low,   excluded.low),
--         close = excluded.close,
--         volume = excluded.volume,
--         closed = true,
--         updated_at = now();
--
--   - The same job also WROTE the OPEN candle for the current minute with
--     closed=false. The chart polls market_latest_candle to update high/low
--     + close every 500 ms (or subscribes via Supabase Realtime).
--
-- Until that backend is in place, the front-end deterministic simulator
-- continues to render the same chart on every machine.

-- Verify: select * from market_symbols;
