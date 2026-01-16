import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = supabaseAnonServer();

  const { data, error } = await supabase
    .from("signals")
    .select("id, observed_at, series_key, is_public")
    .order("observed_at", { ascending: false })
    .limit(5);

  return Response.json({ ok: !error, error: error?.message ?? null, rows: data ?? [] });
}
