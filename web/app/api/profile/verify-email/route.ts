import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getProfileByFirebaseUid, upsertProfile } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

// Marks the user's Supabase profile as KYC-Verified ONLY after Firebase's
// ID-token claim `email_verified` is true. This enforces server-side truth
// — the client cannot self-promote to Verified without Firebase confirming.
export async function POST(req: Request) {
  const auth = await requireAuth(req as any);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });

  if (!auth.claim.email_verified) {
    return NextResponse.json(
      { ok: false, error: "Email is not yet verified. Open the link in your inbox and try again." },
      { status: 412 },
    );
  }

  try {
    const profile = await getProfileByFirebaseUid(auth.claim.uid);
    if (!profile) {
      return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 412 });
    }
    const updated = await upsertProfile({
      firebase_uid: auth.claim.uid,
      email: profile.email,
      name: profile.name,
      kyc_status: "Verified",
    });
    return NextResponse.json({ ok: true, profile: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "supabase_error", detail: e?.message }, { status: 502 });
  }
}
