-- 0001_init.sql — Lumora initial schema
-- Run this in Supabase Studio → SQL editor → New query, then "Run".
-- Idempotent: rerun any time without errors.
--
-- Auth identity lives in Firebase (Google + email/password). Supabase only
-- stores application data. The bridge is the `firebase_uid` column on
-- `public.profiles` — every other table hangs off `profiles.id` (uuid FK).
-- Service-role only: we disable RLS on every table because auth.uid() is
-- not set; if/when you add a JWT verifier, you can re-enable with
-- policies that key off `firebase_uid` (e.g. via a security-definer
-- function that decodes the JWT).

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  firebase_uid  text unique,                                   -- links Supabase row to the Firebase user
  email         text not null unique,
  name          text not null,
  phone         text null,
  kyc_status    text not null default 'Unverified'
                 check (kyc_status in ('Unverified','Pending','Verified')),
  balance_usdt  numeric(18,4) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists profiles_firebase_uid_idx on public.profiles (firebase_uid);

-- Authentication is in Firebase, not Supabase. Enable permissive service-role access.
alter table public.profiles disable row level security;

-- --------------------------------------------------------------- positions --
create table if not exists public.positions (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  symbol        text not null,
  direction     text not null check (direction in ('HIGH','LOW')),
  stake         numeric(18,4) not null,
  entry_price   numeric(18,6) not null,
  exit_price    numeric(18,6) null,
  expires_at    timestamptz not null,
  placed_at     timestamptz not null default now(),
  closed        boolean not null default false,
  result        text null check (result in ('WIN','LOSS')),
  payout        numeric(18,4) null
);
create index if not exists positions_user_open
  on public.positions (user_id, closed, expires_at);
alter table public.positions disable row level security;

-- ---------------------------------------------------------- transactions --
create table if not exists public.transactions (
  id           text primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('Deposit','Withdraw','Trade','Trade result')),
  symbol       text not null,
  amount_usdt  numeric(18,4) not null,
  status       text not null check (status in ('Completed','Processing','Failed','Cancelled')),
  at           timestamptz not null default now()
);
create index if not exists tx_user_at on public.transactions (user_id, at desc);
alter table public.transactions disable row level security;

-- ---------------------------------------------------------- withdrawals --
create table if not exists public.withdrawals (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount_usdt   numeric(18,4) not null,
  method        text not null check (method in ('M-Pesa','Bank')),
  phone         text null,
  status        text not null check (status in ('Completed','Processing','Failed','Cancelled')),
  requested_at  timestamptz not null default now(),
  eta_hours     int  not null default 24
);
alter table public.withdrawals disable row level security;

-- ---------------------------------------------------------- notifications --
create table if not exists public.notifications (
  id          text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('Deposit','Trade','Result','Withdrawal','Failed')),
  msg         text not null,
  at          timestamptz not null default now(),
  read        boolean not null default false
);
create index if not exists notif_user_at on public.notifications (user_id, at desc);
alter table public.notifications disable row level security;

-- Done. Verify with: select id, email, firebase_uid from public.profiles limit 1;
