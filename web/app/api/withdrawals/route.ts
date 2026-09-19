import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listWithdrawalRequests, upsertWithdrawal } from "@/lib/supabase-data";
import type { DBWithdrawal } from "@/lib/supabase-schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  try {
    const rows = await listWithdrawalRequests(auth.claim.uid);
    return NextResponse.json({ ok: true, withdrawals: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount_usdt);
  const method = (body.method === "Bank" ? "Bank" : "M-Pesa") as "M-Pesa" | "Bank";
  const phone = body.phone ?? null;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "amount_invalid" }, { status: 400 });
  }
  const row: Omit<DBWithdrawal, "user_id"> = {
    id: `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    amount_usdt: amount, method, phone,
    status: "Processing", requested_at: new Date().toISOString(), eta_hours: 24,
  };
  try {
    await upsertWithdrawal(auth.claim.uid, row);
    return NextResponse.json({ ok: true, withdrawal: row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}
