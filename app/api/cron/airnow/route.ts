import crypto from 'crypto';
import { supabaseServiceServer } from '@/lib/supabase/server';
import {
  fetchAirNow,
  buildStation,
  buildReadingValue,
  buildFailureValue,
  parameterSlug,
  periodKeyHour,
  stableStringify,
  type AirNowRecord,
  type FailureReason,
} from '@/lib/airnow';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Longwatch's first outward-looking series: EPA AirNow, one named regulatory
 * monitor, three parameters, three independent hash chains.
 *
 * Runs hourly at :35 — AirNow publishes the previous hour 10-30 minutes past,
 * so :35 clears it. Deliberately NOT on the 10-minute heartbeat, which is
 * untouched by this file.
 *
 * ONE call per hour covering every parameter. Exceeding the per-key limit
 * stops AirNow answering until the next hour, so there are no retries: a
 * failure is recorded and the run ends.
 *
 * Never backfills. observed_at is fetch time; AirNow's attributed hour is
 * carried inside value_json as data, because it is a different fact.
 */

/** Approved 2026-08-03. Permanent — these strings are series identity. */
const STATION_AQSID = '840371290002';
const TARGET_PARAMETERS = ['PM2.5', 'OZONE', 'PM10'] as const;

/** Widened box confirmed to return this monitor; Brunswick and Pender hold no
 *  regulatory monitors, so this is the only site it resolves to. */
const BBOX = '-78.65,33.80,-77.40,34.80';
const REQUEST_PARAMETERS = 'PM25,OZONE,PM10';

function seriesKeyFor(parameter: string): string {
  return `lw.air.${STATION_AQSID}.${parameterSlug(parameter)}`;
}

function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hourWindow(now: Date) {
  const end = new Date(now.getTime() - 60 * 60 * 1000);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 13);
  return { startDate: fmt(start), endDate: fmt(end) };
}

/** Matches on FullAQSID, falling back to the shorter forms buildStation reads. */
function isTargetStation(rec: AirNowRecord): boolean {
  const st = buildStation(rec);
  return st.aqsid === STATION_AQSID;
}

export async function GET(req: Request) {
  const expected = (process.env.CRON_SECRET ?? '').trim();
  if (!expected) {
    return Response.json(
      { ok: false, error: 'server_misconfigured', detail: 'CRON_SECRET is not set' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const presented = bearer || (req.headers.get('x-cron-secret') ?? '').trim();
  if (!presented || !secretMatches(presented, expected)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = (process.env.AIRNOW_API_KEY ?? '').trim();
  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'server_misconfigured', detail: 'AIRNOW_API_KEY is not set' },
      { status: 500 },
    );
  }

  const now = new Date();
  const observed_at = now.toISOString();
  const period_key = periodKeyHour(now);
  const { startDate, endDate } = hourWindow(now);

  // Exactly one outbound call. No retries.
  const out = await fetchAirNow({
    apiKey,
    bbox: BBOX,
    parameters: REQUEST_PARAMETERS,
    startDate,
    endDate,
  });

  // Resolve, per target parameter, either a reading or a typed failure.
  type Resolved =
    | { kind: 'snapshot'; parameter: string; value: ReturnType<typeof buildReadingValue> }
    | { kind: 'no_reading'; parameter: string; reason: FailureReason; http_status: number | null };

  const resolved: Resolved[] = TARGET_PARAMETERS.map((parameter) => {
    if (!out.ok) {
      // Whole call failed: every series records that it was checked.
      return { kind: 'no_reading', parameter, reason: out.reason, http_status: out.http_status };
    }
    const rec = out.records.find(
      (r) => isTargetStation(r) && typeof r.Parameter === 'string' && r.Parameter === parameter,
    );
    if (!rec) {
      return { kind: 'no_reading', parameter, reason: 'station_absent', http_status: 200 };
    }
    const value = buildReadingValue(rec);
    if (!value) {
      return { kind: 'no_reading', parameter, reason: 'no_concentration', http_status: 200 };
    }
    return { kind: 'snapshot', parameter, value };
  });

  const supabase = supabaseServiceServer();
  const inserted: unknown[] = [];
  const deduped: unknown[] = [];
  const failed: unknown[] = [];

  for (const r of resolved) {
    const series_key = seriesKeyFor(r.parameter);
    const signal_type = r.kind === 'snapshot' ? 'snapshot' : 'no_reading';
    const value_json =
      r.kind === 'snapshot'
        ? r.value
        : buildFailureValue(r.reason, r.http_status, {
            aqsid: STATION_AQSID,
            site_name: null,
            parameter: r.parameter,
          });

    // Each series chains independently.
    const { data: last, error: lastErr } = await supabase
      .from('signals')
      .select('row_hash')
      .eq('series_key', series_key)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      failed.push({ series_key, stage: 'read_head', detail: lastErr.message });
      continue;
    }

    const prev_hash = last?.row_hash ?? null;
    const source = 'cron:airnow:v1';
    const canonical = [
      observed_at,
      signal_type,
      series_key,
      source,
      stableStringify(value_json),
      prev_hash ?? '',
    ].join('|');
    const row_hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

    const { data: row, error: insErr } = await supabase
      .from('signals')
      .insert({
        observed_at,
        signal_type,
        series_key,
        source,
        value_json,
        meta_json: { version: 1, station_aqsid: STATION_AQSID },
        is_public: true,
        prev_hash,
        row_hash,
        period_key,
      })
      .select('id, series_key, observed_at, signal_type, row_hash, prev_hash, period_key')
      .single();

    if (insErr) {
      if ((insErr as { code?: string }).code === '23505') {
        deduped.push({ series_key, period_key });
        continue;
      }
      failed.push({ series_key, stage: 'insert', detail: insErr.message });
      continue;
    }
    inserted.push(row);
  }

  const status = failed.length > 0 ? 500 : 200;
  return Response.json(
    {
      ok: failed.length === 0,
      observed_at,
      period_key,
      station_aqsid: STATION_AQSID,
      fetch_ok: out.ok,
      snapshots: resolved.filter((r) => r.kind === 'snapshot').map((r) => r.parameter),
      no_readings: resolved
        .filter((r): r is Extract<Resolved, { kind: 'no_reading' }> => r.kind === 'no_reading')
        .map((r) => ({ parameter: r.parameter, reason: r.reason })),
      inserted,
      deduped,
      failed,
    },
    { status },
  );
}
