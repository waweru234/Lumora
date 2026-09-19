import { NextResponse, type NextRequest } from "next/server";
import { verifyIdToken, type FirebaseClaim } from "@/lib/firebase-admin";

export type AuthOk = { ok: true; claim: FirebaseClaim };
export type AuthErr = { ok: false; reason: string };

export async function requireAuth(req: NextRequest): Promise<AuthOk | AuthErr> {
  const header = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const idToken = m?.[1];

  if (!idToken) {
    return { ok: false, reason: "missing Authorization Bearer <idToken>" };
  }

  const claim = await verifyIdToken(idToken);
  if (!claim) {
    return { ok: false, reason: "invalid or expired idToken" };
  }
  return { ok: true, claim };
}

export function authErrorResponse(err: AuthErr, status = 401) {
  return NextResponse.json({ ok: false, error: err.reason }, { status });
}
