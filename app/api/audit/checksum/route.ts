import { supabaseAnonServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Ledger checksum: the real row count and the real head hash.
 *
 * This previously returned `row_count: 0` with `checksum: 'placeholder'` and a
 * `snapshot_date` of today — a stub shaped like an audit result. The head
 * row_hash already commits to the whole chain, so it is the checksum.
 */
export async function GET() {
  const supabase = supabaseAnonServer();

  const [headRes, countRes] = await Promise.all([
    supabase
      .from('signals')
      .select('observed_at,row_hash,series_key')
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('signals').select('id', { count: 'exact' }).range(0, 0),
  ]);

  const error = headRes.error ?? countRes.error;
  if (error) {
    return Response.json(
      { ok: false, error: 'db_read_failed', detail: error.message },
      { status: 500 },
    );
  }

  const head = headRes.data as { observed_at: string; row_hash: string; series_key: string } | null;

  return Response.json(
    {
      ok: true,
      row_count: countRes.count ?? 0,
      head_hash: head?.row_hash ?? null,
      head_observed_at: head?.observed_at ?? null,
      head_series_key: head?.series_key ?? null,
      computed_at: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
