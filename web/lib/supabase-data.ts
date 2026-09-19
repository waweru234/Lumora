// Server-side data helpers — service-role Supabase writes keyed by firebase_uid.
// All return shapes are typed loosely (`any`) because we don't have a generated
// Database type; we apply our server-side types after the round trip.

import { getSupabaseAdmin } from "./supabase-admin";
import { TABLES, type DBProfile, type DBTransactionRow, type DBWithdrawal } from "./supabase-schema";

type RuntimeError = Error & { code?: string };

function client(): ReturnType<typeof getSupabaseAdmin> {
  const c = getSupabaseAdmin();
  if (!c) {
    const e: RuntimeError = new Error("Supabase admin not configured");
    e.code = "NO_SUPABASE";
    throw e;
  }
  return c as any;
}

export async function getProfileByFirebaseUid(firebaseUid: string): Promise<DBProfile | null> {
  const sb: any = client();
  const { data, error } = await sb.from(TABLES.profiles)
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();
  if (error) throw error;
  return (data as DBProfile) ?? null;
}

export async function upsertProfile(p: Partial<DBProfile> & { firebase_uid: string; email: string; name: string }): Promise<DBProfile> {
  const sb: any = client();
  const row = { ...p, balance_usdt: (p as any).balance_usdt ?? 0, kyc_status: p.kyc_status ?? "Unverified" };
  const { data, error } = await sb.from(TABLES.profiles)
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "firebase_uid" })
    .select("*").single();
  if (error) throw error;
  return data as DBProfile;
}

export async function setBalance(firebaseUid: string, balanceUsdt: number) {
  const sb: any = client();
  const { error } = await sb.from(TABLES.profiles)
    .update({ balance_usdt: balanceUsdt, updated_at: new Date().toISOString() })
    .eq("firebase_uid", firebaseUid);
  if (error) throw error;
}

export async function listTransactions(firebaseUid: string, limit = 100): Promise<DBTransactionRow[]> {
  const sb: any = client();
  const profile = await getProfileByFirebaseUid(firebaseUid);
  if (!profile) return [];
  const { data, error } = await sb.from(TABLES.transactions)
    .select("*")
    .eq("user_id", profile.id)
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DBTransactionRow[];
}

export async function insertTransaction(firebaseUid: string, row: { id: string; kind: any; symbol: string; amount_usdt: number; status: any; at?: string }) {
  const sb: any = client();
  const profile = await getProfileByFirebaseUid(firebaseUid);
  if (!profile) throw new Error("profile_not_found");
  const { error } = await sb.from(TABLES.transactions).insert({
    id: row.id,
    user_id: profile.id,
    kind: row.kind,
    symbol: row.symbol,
    amount_usdt: row.amount_usdt,
    status: row.status,
    at: row.at ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function listWithdrawalRequests(firebaseUid?: string): Promise<DBWithdrawal[]> {
  const sb: any = client();
  let q = sb.from(TABLES.withdrawals)
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(200);
  if (firebaseUid) {
    const prof = await getProfileByFirebaseUid(firebaseUid);
    if (prof) q = q.eq("user_id", prof.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DBWithdrawal[];
}

export async function upsertWithdrawal(firebaseUid: string, w: Omit<DBWithdrawal, "user_id">) {
  const sb: any = client();
  const prof = await getProfileByFirebaseUid(firebaseUid);
  if (!prof) throw new Error("profile_not_found");
  const { error } = await sb.from(TABLES.withdrawals)
    .upsert({ ...w, user_id: prof.id }, { onConflict: "id" });
  if (error) throw error;
}
