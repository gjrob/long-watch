import { supabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = supabaseAnonServer();

const { data, error } = await supabase
  .from("signals")
  .select("*")
  .order("observed_at", { ascending: false })
  .limit(1)
  .maybeSingle();


  if (error) {
    return Response.json(
      { ok: false, error: "db_read_failed", detail: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    observed_at: data?.observed_at ?? null,
    signal: data ?? null,
  });
}
