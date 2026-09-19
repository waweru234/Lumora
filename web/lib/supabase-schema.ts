// Domain tables — single source of truth for typed Supabase access.

// Row shapes mirror create_table statements in supabase/migrations/0001_init.sql.
export type DBProfile = {
  id: string;             // uuid
  firebase_uid?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  kyc_status?: "Unverified" | "Pending" | "Verified";
  balance_usdt?: number;
  created_at: string;
  updated_at?: string;
};

export type DBPosition = {
  id: string;
  user_id: string;
  symbol: string;
  direction: "HIGH" | "LOW";
  stake: number;
  entry_price: number;
  exit_price: number | null;
  expires_at: string;
  placed_at: string;
  closed: boolean;
  result: "WIN" | "LOSS" | null;
  payout: number | null;
};

export type DBTransactionRow = {
  id: string;
  user_id: string;
  kind: "Deposit" | "Withdraw" | "Trade" | "Trade result";
  symbol: string;
  amount_usdt: number;
  status: "Completed" | "Processing" | "Failed" | "Cancelled";
  at: string;
};

export type DBWithdrawal = {
  id: string;
  user_id: string;
  amount_usdt: number;
  method: "M-Pesa" | "Bank";
  phone: string | null;
  status: "Completed" | "Processing" | "Failed" | "Cancelled";
  requested_at: string;
  eta_hours: number;
};

export type DBNotification = {
  id: string;
  user_id: string;
  kind: "Deposit" | "Trade" | "Result" | "Withdrawal" | "Failed";
  msg: string;
  at: string;
  read: boolean;
};

export const TABLES = {
  profiles:     "profiles",
  positions:    "positions",
  transactions: "transactions",
  withdrawals:  "withdrawals",
  notifications: "notifications",
} as const;
