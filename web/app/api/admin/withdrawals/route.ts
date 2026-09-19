import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { listWithdrawalRequests } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Service-role read: protect with Firebase ID token of an admin user.
  // In production, restrict to specific admin UIDs.
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!m) return NextResponse.json({ ok: false, error: "missing Bearer idToken" }, { status: 401 });
  const claim = await verifyIdToken(m[1]);
  if (!claim) return NextResponse.json({ ok: false, error: "invalid idToken" }, { status: 401 });

  try {
    const rows = await listWithdrawalRequests(); // no firebase_uid filter; admin scope
    return NextResponse.json({ ok: true, withdrawals: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}
