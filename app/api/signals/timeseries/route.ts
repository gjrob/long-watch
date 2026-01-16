import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seriesKey = searchParams.get("series_key") ?? "lw.core.default";
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 2000);
  const since = searchParams.get("since"); // ISO timestamp or null

  const supabase = supabaseAnonServer();

  let q = supabase
    .from("signals")
    .select("id, observed_at, signal_type, series_key, source, value_json, meta_json, row_hash, prev_hash")
    .eq("is_public", true)
    .eq("series_key", seriesKey)
    .order("observed_at", { ascending: true })
    .limit(limit);

  if (since) q = q.gte("observed_at", since);

  const { data, error } = await q;

  if (error) {
    return Response.json(
      { ok: false, error: "db_read_failed", detail: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    series_key: seriesKey,
    count: data?.length ?? 0,
    points: data ?? [],
  });
}
