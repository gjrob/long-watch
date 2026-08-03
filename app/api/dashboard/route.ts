import type {
  DashboardData,
  Observation,
  SeriesSummary,
  AnomalyRecord,
  LedgerEntryPublic,
  ProbePoint,
} from '@/lib/types';
import { analyzeContinuity } from '@/lib/continuity';
import { supabaseAnonServer } from '@/lib/supabase/server';
import { KNOWN_SERIES } from '@/lib/airnow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The dashboard reads the ledger. It does not model it.
 *
 * Until 2026-08 this route called generateTimeseries()/generateAnomalies() and
 * served an invented 30-day window — invented observations, invented sigma
 * anomalies, invented continuity, and `latest.observed_at = now`. The page
 * therefore always looked live and always read STABLE, including through the
 * six months the writer was returning 401 and nothing was being recorded.
 *
 * Every value below now comes from `signals` or `anomalies`. Read-only: no
 * INSERT path runs on page load (the previous version wrote an anchor row via
 * getOrCreateDailyAnchor on every single request).
 */

/** Writer cadence. Must match periodKey10Min in /api/cron/generate. */
const EXPECTED_INTERVAL_SECONDS = 10 * 60;
/** Grace before the instrument is considered no longer observing: 3 intervals. */
const STALE_AFTER_SECONDS = EXPECTED_INTERVAL_SECONDS * 3;
/** The series whose cadence defines whether we are observing at all. */
const HEARTBEAT_SERIES = 'lw.core.heartbeat';
const PROBE_SERIES = 'lw.external.http_probe';

/**
 * Per-series staleness thresholds, in seconds. A series is stale when its
 * newest SNAPSHOT is older than this. AirNow publishes hourly, so three
 * missed hours is the equivalent grace the heartbeat gets at three intervals.
 */
const STALE_AFTER: Record<string, number> = {
  'lw.core.heartbeat': 10 * 60 * 3,
  'lw.external.http_probe': 10 * 60 * 3,
};
const AIR_STALE_AFTER = 60 * 60 * 3;

const TAIL_LIMIT = 8;
const PROBE_LIMIT = 200;
/** Cap on heartbeat rows pulled for continuity analysis. */
const CONTINUITY_LIMIT = 5000;

type SignalRow = {
  id: string;
  observed_at: string;
  series_key: string;
  source: string | null;
  signal_type: string | null;
  row_hash: string;
  prev_hash: string | null;
  period_key: string | null;
  value_json: unknown;
};

function ageSeconds(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((nowMs - t) / 1000));
}

function probeOf(row: { observed_at: string; value_json: unknown }): ProbePoint {
  const v = (row.value_json ?? {}) as Record<string, unknown>;
  return {
    observed_at: row.observed_at,
    latency_ms: typeof v.latency_ms === 'number' ? v.latency_ms : null,
    status: typeof v.status === 'number' ? v.status : null,
    ok: v.ok === true,
  };
}

export async function GET() {
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();

  const empty = (error: string | null): DashboardData => ({
    observing: {
      is_observing: false,
      last_observed_at: null,
      age_seconds: null,
      expected_interval_seconds: EXPECTED_INTERVAL_SECONDS,
      stale_after_seconds: STALE_AFTER_SECONDS,
    },
    latest: null,
    series: [],
    anomalies: [],
    ledger: { row_count: 0, head_hash: null, genesis_hash: null, series_count: 0 },
    ledger_tail: [],
    probe: [],
    continuity: {
      expected_interval_hours: EXPECTED_INTERVAL_SECONDS / 3600,
      total_expected: 0,
      total_observed: 0,
      continuity_pct: 0,
      gap_count: 0,
      missed_total: 0,
      gaps: [],
      gaps_truncated: false,
      longest_gap_hours: 0,
      periods: [],
      window_start: '',
      window_end: nowIso,
    },
    fetched_at: nowIso,
    error,
  });

  let supabase;
  try {
    supabase = supabaseAnonServer();
  } catch (e) {
    return Response.json(empty(e instanceof Error ? e.message : 'supabase not configured'), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }

  const [latestRes, tailRes, countRes, oldestRes, heartbeatRes, probeRes, anomaliesRes] =
    await Promise.all([
      supabase
        .from('signals')
        .select(
          'id,observed_at,series_key,source,signal_type,row_hash,prev_hash,period_key,value_json',
        )
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('signals')
        .select('observed_at,series_key,row_hash,prev_hash')
        .order('observed_at', { ascending: false })
        .limit(TAIL_LIMIT),
      supabase.from('signals').select('id', { count: 'exact' }).range(0, 0),
      supabase
        .from('signals')
        .select('observed_at,row_hash')
        .order('observed_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('signals')
        .select('observed_at')
        .eq('series_key', HEARTBEAT_SERIES)
        .eq('signal_type', 'snapshot')
        .order('observed_at', { ascending: true })
        .limit(CONTINUITY_LIMIT),
      supabase
        .from('signals')
        .select('observed_at,value_json')
        .eq('series_key', PROBE_SERIES)
        .order('observed_at', { ascending: false })
        .limit(PROBE_LIMIT),
      // Expected to be empty. Rendered as "none recorded" — never invented.
      supabase
        .from('anomalies')
        .select('id,observed_at,series_key,severity,kind,message')
        .order('observed_at', { ascending: false })
        .limit(50),
    ]);

  const firstError =
    latestRes.error ?? tailRes.error ?? countRes.error ?? oldestRes.error ?? heartbeatRes.error;
  if (firstError) {
    return Response.json(empty(firstError.message), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }

  const latestRow = (latestRes.data as SignalRow | null) ?? null;
  const latest: Observation | null = latestRow
    ? {
        id: latestRow.id,
        observed_at: latestRow.observed_at,
        series_key: latestRow.series_key,
        source: latestRow.source,
        signal_type: latestRow.signal_type,
        row_hash: latestRow.row_hash,
        prev_hash: latestRow.prev_hash,
        period_key: latestRow.period_key,
        value_json: latestRow.value_json,
      }
    : null;

  const heartbeats = (heartbeatRes.data ?? []) as { observed_at: string }[];
  const probeRows = (probeRes.data ?? []) as { observed_at: string; value_json: unknown }[];

  // ── Per-series freshness, computed from signal_type='snapshot' ONLY ──
  // A no_reading row records that we checked and got nothing. It is NOT an
  // observation, so it must not reset the clock. Counting it would let a week
  // of AirNow outages read as "current" while no measurement had arrived —
  // the same false-green this instrument was rebuilt to eliminate.
  const seriesResults = await Promise.all(
    KNOWN_SERIES.map(async (def) => {
      const [totalRes, snapRes] = await Promise.all([
        supabase
          .from('signals')
          .select('id', { count: 'exact' })
          .eq('series_key', def.key)
          .range(0, 0),
        supabase
          .from('signals')
          .select('observed_at', { count: 'exact' })
          .eq('series_key', def.key)
          .eq('signal_type', 'snapshot')
          .order('observed_at', { ascending: false })
          .range(0, 0),
      ]);
      const newestSnapshot =
        (snapRes.data as { observed_at: string }[] | null)?.[0]?.observed_at ?? null;
      const age = ageSeconds(newestSnapshot, nowMs);
      const threshold = STALE_AFTER[def.key] ?? AIR_STALE_AFTER;
      return {
        series_key: def.key,
        label: def.label,
        count: totalRes.count ?? 0,
        snapshot_count: snapRes.count ?? 0,
        first_observed_at: null as string | null,
        last_observed_at: newestSnapshot,
        age_seconds: age,
        is_stale: age === null || age > threshold,
      };
    }),
  );
  const series: SeriesSummary[] = seriesResults;

  // Newest SNAPSHOT across all series — a no_reading row is not an observation
  // and must not make the instrument look like it is watching.
  const newestSnapshotAt = seriesResults
    .map((s) => s.last_observed_at)
    .filter((v): v is string => v !== null)
    .sort()
    .pop() ?? null;
  const observedAge = ageSeconds(newestSnapshotAt, nowMs);
  const observing = {
    is_observing: observedAge !== null && observedAge <= STALE_AFTER_SECONDS,
    last_observed_at: newestSnapshotAt,
    age_seconds: observedAge,
    expected_interval_seconds: EXPECTED_INTERVAL_SECONDS,
    stale_after_seconds: STALE_AFTER_SECONDS,
  };

  // Continuity across the REAL history, window running to now so the silence
  // since the last observation is counted rather than cropped out.
  const c = analyzeContinuity(
    heartbeats.map((h) => ({ observed_at: h.observed_at })),
    EXPECTED_INTERVAL_SECONDS / 3600,
    1.5,
    nowIso,
  );

  const ledger_tail: LedgerEntryPublic[] = (
    (tailRes.data ?? []) as {
      observed_at: string;
      series_key: string;
      row_hash: string;
      prev_hash: string | null;
    }[]
  ).map((r) => ({
    observed_at: r.observed_at,
    series_key: r.series_key,
    prev_hash: r.prev_hash,
    row_hash: r.row_hash,
  }));

  const oldest = (oldestRes.data as { observed_at: string; row_hash: string } | null) ?? null;

  const data: DashboardData = {
    observing,
    latest,
    series,
    anomalies: (anomaliesRes.data ?? []) as AnomalyRecord[],
    ledger: {
      row_count: countRes.count ?? 0,
      head_hash: latest?.row_hash ?? null,
      genesis_hash: oldest?.row_hash ?? null,
      series_count: series.length,
    },
    ledger_tail,
    probe: probeRows.map(probeOf).reverse(),
    continuity: {
      expected_interval_hours: c.expected_interval_hours,
      total_expected: c.total_expected,
      total_observed: c.total_observed,
      continuity_pct: c.continuity_pct,
      gap_count: c.gap_count,
      missed_total: c.missed_total,
      gaps: c.gaps,
      gaps_truncated: c.gaps_truncated,
      longest_gap_hours: c.longest_gap_hours,
      periods: c.periods,
      window_start: c.window_start,
      window_end: c.window_end,
    },
    fetched_at: nowIso,
    error: anomaliesRes.error ? `anomalies: ${anomaliesRes.error.message}` : null,
  };

  return Response.json(data, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
