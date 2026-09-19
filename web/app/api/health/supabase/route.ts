import { NextResponse } from "next/server";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)";
  const hasSecret = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseAdminConfigured()) {
    return NextResponse.json({
      ok: false,
      reason: "Missing env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).",
      url, hasSecret,
    }, { status: 503 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, reason: "client init failed", url }, { status: 503 });
  }
  try {
    // `select 1` is verified cheaply via REST.
    const t0 = Date.now();
    const { error } = await sb.from("profiles").select("id", { count: "exact", head: true });
    const dt = Date.now() - t0;
    if (error) {
      return NextResponse.json({
        ok: false, reason: "REST error", error: error.message, url, hasSecret, latencyMs: dt,
      }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url, hasSecret, latencyMs: dt });
  } catch (e: any) {
    return NextResponse.json({
      ok: false, reason: "exception", error: e?.message ?? String(e), url,
    }, { status: 502 });
  }
}
