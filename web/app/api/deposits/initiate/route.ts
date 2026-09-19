import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { serverStkPush } from "@/lib/mpesa-server";
import { recordDeposit } from "../_state";

export const dynamic = "force-dynamic";

// USDT → KES conversion rate is pulled from the live profile (or a sensible fallback).
const FALLBACK_RATE = 129.5;

const MIN_USDT = 1;
const MAX_USDT = 250_000;

function looksLikePhone(p: string) {
  return /^(?:\+?254|0)(7|1)\d{8}$/.test(p.replace(/[^0-9]/g, ""));
}

export async function POST(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const usdtAmount = Number(body.amount_usdt ?? body.amount);
  const phone = String(body.phone ?? "").trim();

  if (!Number.isFinite(usdtAmount) || usdtAmount < MIN_USDT || usdtAmount > MAX_USDT) {
    return NextResponse.json({ ok: false, error: `amount_invalid: minimum is ${MIN_USDT} USDT, max ${MAX_USDT} USDT` }, { status: 400 });
  }
  if (!looksLikePhone(phone)) {
    return NextResponse.json({ ok: false, error: "phone_invalid: use 07xxxxxxxx or 2547xxxxxxxx" }, { status: 400 });
  }

  const rate = FALLBACK_RATE;
  const kesAmount = Math.round(usdtAmount * rate);

  try {
    const data = await serverStkPush({
      phoneNumber: phone,
      amount: kesAmount,             // Daraja expects whole KES
      accountReference: "LUMORA-DEP",
      transactionDesc: "Wallet top-up",
    });

    recordDeposit(data.CheckoutRequestID, {
      uid: auth.claim.uid,
      phone,
      usdtAmount,
      kesAmount,
    });

    return NextResponse.json({
      ok: true,
      checkoutRequestID: data.CheckoutRequestID,
      merchantRequestID: data.MerchantRequestID,
      usdtAmount,
      kesAmount,
      rate,
      customerMessage: data.CustomerMessage,
      status: "Processing",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "stkpush_failed" }, { status: 502 });
  }
}
