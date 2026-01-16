import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const series_key = url.searchParams.get("series_key") ?? "lw.core.heartbeat";

  const supabase = supabaseAnonServer();

  // latest row
  const { data: latest, error: e1 } = await supabase
    .from("signals")
    .select("id, observed_at, row_hash, prev_hash, period_key")
    .eq("is_public", true)
    .eq("series_key", series_key)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e1) {
    return Response.json({ ok: false, error: "db_read_failed", detail: e1.message }, { status: 500 });
  }

  // count
  const { count, error: e2 } = await supabase
    .from("signals")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true)
    .eq("series_key", series_key);

  if (e2) {
    return Response.json({ ok: false, error: "db_count_failed", detail: e2.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    series_key,
    count: count ?? 0,
    latest: latest ?? null,
    // verification is a separate call (/api/verify/head or /api/verify/series)
    note: "Use /api/verify/head for fast integrity validation.",
  });
}
