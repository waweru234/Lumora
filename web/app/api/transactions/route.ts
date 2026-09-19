import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listTransactions } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  try {
    const rows = await listTransactions(auth.claim.uid, 200);
    return NextResponse.json({ ok: true, transactions: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}
