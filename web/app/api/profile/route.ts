import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getProfileByFirebaseUid, upsertProfile } from "@/lib/supabase-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { DBProfile } from "@/lib/supabase-schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });

  let profile: DBProfile | null = null;
  try { profile = await getProfileByFirebaseUid(auth.claim.uid); }
  catch (e: any) { return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 }); }

  // Auto-create profile row on first sign-in (idempotent via upsert)
  if (!profile) {
    try {
      profile = await upsertProfile({
        firebase_uid: auth.claim.uid,
        email: auth.claim.email ?? `${auth.claim.uid}@unknown.local`,
        name: auth.claim.name ?? (auth.claim.email?.split("@")[0] ?? "Trader"),
        kyc_status: "Unverified",
      });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: "profile_upsert_failed", detail: e?.message }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, profile, claim: { uid: auth.claim.uid, email: auth.claim.email, name: auth.claim.name } });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim() || null;
  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });

  try {
    const profile = await upsertProfile({
      firebase_uid: auth.claim.uid,
      email: auth.claim.email ?? `${auth.claim.uid}@unknown.local`,
      name,
      phone,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}

export async function HEAD() {
  const ok = !!getSupabaseAdmin();
  return NextResponse.json({ ok }); // unused but registers the route
}
