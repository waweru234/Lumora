import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { serverStkStatus } from "@/lib/mpesa-server";
import { consumeDeposit, peekDeposit } from "../_state";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TABLES, type DBTransactionRow } from "@/lib/supabase-schema";
import { getProfileByFirebaseUid, setBalance, insertTransaction } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 60_000;

const FALLBACK_RATE = 129.5;

async function pollUntilDone(checkoutRequestID: string) {
  const start = Date.now();
  let last: any = null;
  let lastErr: any = null;
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    try {
      const data = await serverStkStatus(checkoutRequestID);
      last = data;
      const code = Number(data?.ResponseCode ?? -1);
      // Daraja returns ResponseCode 0 once the user has paid; non-zero otherwise.
      // Some responses include ResultCode nested — accept any of them.
      if (code === 0 || Number(data?.ResultCode) === 0) return { ok: true, data };
      // Common failure codes: 1032 (cancelled), 2001 (insufficient), 1 (generic failure)
      if (code === 1032 || code === 2001 || code === 1) return { ok: false, code, data };
      lastErr = new Error(`processing (code=${code})`);
    } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  return { ok: false, code: null, data: last, error: lastErr };
}

export async function POST(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const checkoutRequestID = String(body.checkoutRequestID ?? "");
  if (!checkoutRequestID) {
    return NextResponse.json({ ok: false, error: "missing_checkoutRequestID" }, { status: 400 });
  }

  const pending = consumeDeposit(checkoutRequestID);
  if (!pending || pending.uid !== auth.claim.uid) {
    return NextResponse.json({ ok: false, error: "unknown_or_expired_checkoutRequestID" }, { status: 404 });
  }

  const polled = await pollUntilDone(checkoutRequestID);

  if (!polled.ok) {
    return NextResponse.json({
      ok: true, status: "Failed", detail: polled.error?.message ?? "no_result",
      pollingTimedOut: !polled.code,
    });
  }

  // Confirmed. Pull profile, credit balance (using USDT amount we originally accepted).
  try {
    if (!getSupabaseAdmin()) {
      return NextResponse.json({
        ok: true, status: "Completed",
        appliedLocallyOnly: true,
        balanceUsdt: pending.usdtAmount,
        note: "Supabase not configured — deposit recorded locally only.",
      });
    }

    const profile = await getProfileByFirebaseUid(pending.uid);
    if (!profile) {
      return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 412 });
    }
    const newBalance = Number((profile as any).balance_usdt ?? 0) + pending.usdtAmount;
    await setBalance(pending.uid, newBalance);

    const tx: Omit<DBTransactionRow, "user_id"> = {
      id: `tx-${checkoutRequestID.slice(-12)}-${Date.now().toString(36)}`,
      kind: "Deposit",
      symbol: "USDT",
      amount_usdt: pending.usdtAmount,
      status: "Completed",
      at: new Date().toISOString(),
    };
    await insertTransaction(pending.uid, tx);

    return NextResponse.json({
      ok: true, status: "Completed",
      balanceUsdt: newBalance,
      usdtAmount: pending.usdtAmount,
      kesAmount: pending.kesAmount,
      rate: FALLBACK_RATE,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}

// Optional: peek endpoint returns current polled state without consuming
export async function GET(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("checkout") ?? "";
  const p = peekDeposit(id);
  if (!p) return NextResponse.json({ ok: false, error: "unknown_or_expired" }, { status: 404 });
  return NextResponse.json({ ok: true, pending: p });
}
