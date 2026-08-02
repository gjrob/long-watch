import { supabaseAnonServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reads the `anomalies` table.
 *
 * This endpoint previously returned a hardcoded item — `sigma: 2.4`,
 * `status: 'resolved'`, `detected_at: new Date()` — so it reported a fresh
 * resolved anomaly on every request, forever, having detected nothing. The
 * table is currently empty and this returns an empty list.
 */
export async function GET() {
  const supabase = supabaseAnonServer();

  const { data, error, count } = await supabase
    .from('anomalies')
    .select('id,observed_at,series_key,severity,kind,message', { count: 'exact' })
    .order('observed_at', { ascending: false })
    .limit(100);

  if (error) {
    return Response.json(
      { ok: false, error: 'db_read_failed', detail: error.message },
      { status: 500 },
    );
  }

  return Response.json(
    { ok: true, count: count ?? 0, items: data ?? [] },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
