import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Reads the latest candle for a (symbol, timeframe) pair from Supabase.
// Until the server-side cron populates the table, this returns 204 with an
// empty payload — and the front end falls back to its deterministic local
// simulator so the chart still moves.
export async function GET(req: Request) {
  if (!getSupabaseAdmin()) {
    return NextResponse.json({ ok: false, candles: [], source: "no_supabase" }, { status: 200 });
  }
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol");
  const timeframe = url.searchParams.get("timeframe");
  if (!symbol || !timeframe) {
    return NextResponse.json({ ok: false, error: "missing symbol / timeframe" }, { status: 400 });
  }

  try {
    const sb: any = getSupabaseAdmin();
    const { data, error } = await sb.from("market_candles")
      .select("symbol, timeframe, start, open, high, low, close, volume, closed")
      .eq("symbol", symbol)
      .eq("timeframe", timeframe)
      .order("start", { ascending: false })
      .limit(240);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, candles: data ?? [], source: "supabase" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 502 });
  }
}
