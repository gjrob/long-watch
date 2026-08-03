/**
 * AirNow ingestion — shared by the hourly writer and the diagnostic route.
 *
 * SAFETY CONTRACT (non-negotiable — this writes to an append-only public
 * ledger, so a leaked key cannot be deleted afterwards):
 *
 *   value_json is built by an ALLOW-LIST. Every field is copied by name from
 *   a parsed record into a fresh object. The response object, the error
 *   object and the request URL NEVER enter a builder. There is no redaction
 *   step because there is no path in — a blacklist would have to anticipate
 *   every variant of "the URL ended up in the message"; this has none.
 *
 *   In particular: fetch() failures in Node routinely embed the full request
 *   URL in error.message, and that URL contains API_KEY. So error.message is
 *   never read, never logged, and never returned. Failures collapse to a
 *   fixed enum plus an HTTP status number.
 */

export type FailureReason =
  | 'http_error'
  | 'timeout'
  | 'network_error'
  | 'empty_response'
  | 'malformed_response'
  | 'station_absent'
  | 'no_concentration';

export type AirNowRecord = Record<string, unknown>;

export type FetchOutcome =
  | { ok: true; records: AirNowRecord[]; observed_field_names: string[] }
  | { ok: false; reason: FailureReason; http_status: number | null };

/**
 * AirNow `Parameter` string -> permanent series slug.
 * Lowercase, non-alphanumerics dropped. These become part of a series key and
 * are therefore permanent; confirm against live output before first write.
 */
export function parameterSlug(parameter: string): string {
  return String(parameter).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** PM2.5 -> pm25 | PM10 -> pm10 | OZONE -> ozone | NO2 -> no2 | SO2 -> so2 | CO -> co */
export const PARAMETER_SLUG_EXAMPLES: Record<string, string> = {
  'PM2.5': 'pm25',
  PM10: 'pm10',
  OZONE: 'ozone',
  NO2: 'no2',
  SO2: 'so2',
  CO: 'co',
};

export const AIRNOW_DATA_HOST = 'https://www.airnowapi.org';

/** Key-sorted JSON, matching the canonical form the heartbeat writer uses. */
export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const rec = obj as Record<string, unknown>;
  return (
    '{' +
    Object.keys(rec)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(rec[k]))
      .join(',') +
    '}'
  );
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

/** Station identity, copied field by field. Recorded on every row. */
export function buildStation(rec: AirNowRecord) {
  return {
    aqsid: str(rec.FullAQSID) ?? str(rec.AQSID) ?? str(rec.IntlAQSCode),
    site_name: str(rec.SiteName),
    agency: str(rec.AgencyName),
    latitude: num(rec.Latitude),
    longitude: num(rec.Longitude),
  };
}

/**
 * A reading. `concentration` and `units` are mandatory — if either is missing
 * this returns null and the caller records a no_reading row instead. AQI is
 * recorded when present but never substituted for the measurement.
 */
export function buildReadingValue(rec: AirNowRecord) {
  const station = buildStation(rec);
  const parameter = str(rec.Parameter);
  const units = str(rec.Unit);
  const raw = num(rec.RawConcentration);
  const value = num(rec.Value);
  const concentration = raw !== null && raw >= 0 ? raw : value;

  if (!parameter || units === null || concentration === null) return null;

  return {
    station,
    parameter,
    concentration,
    units,
    concentration_source: raw !== null && raw >= 0 ? 'RawConcentration' : 'Value',
    aqi: num(rec.AQI),
    aqi_category:
      rec.Category && typeof rec.Category === 'object'
        ? str((rec.Category as Record<string, unknown>).Name)
        : null,
    measured_at_utc: str(rec.UTC),
    source: 'EPA AirNow',
    source_endpoint: '/aq/data/',
  };
}

/**
 * A failure. NOTE what is absent: no `concentration`, no `units`, no `aqi`.
 * A consumer reading value_json.concentration gets undefined and cannot
 * render a number. The row is additionally marked signal_type='no_reading',
 * which sits inside the canonical hash string.
 */
export function buildFailureValue(
  reason: FailureReason,
  http_status: number | null,
  requested: { aqsid: string | null; site_name: string | null; parameter: string | null },
) {
  return {
    reason,
    http_status,
    station_requested: {
      aqsid: requested.aqsid,
      site_name: requested.site_name,
    },
    parameter_requested: requested.parameter,
    note: 'checked; no measurement returned',
    source: 'EPA AirNow',
    source_endpoint: '/aq/data/',
  };
}

/**
 * Perform the AirNow call. The key is placed in the outbound URL because
 * AirNow supports no header auth. That URL is local to this function and is
 * never returned, logged, or attached to any error.
 */
export async function fetchAirNow(opts: {
  apiKey: string;
  bbox: string;
  parameters: string;
  startDate: string;
  endDate: string;
  timeoutMs?: number;
  hostOverride?: string;
}): Promise<FetchOutcome> {
  const host = opts.hostOverride ?? AIRNOW_DATA_HOST;
  const url =
    `${host}/aq/data/?startDate=${encodeURIComponent(opts.startDate)}` +
    `&endDate=${encodeURIComponent(opts.endDate)}` +
    `&parameters=${encodeURIComponent(opts.parameters)}` +
    `&BBOX=${encodeURIComponent(opts.bbox)}` +
    `&dataType=B&format=application/json&verbose=1&monitorType=0` +
    `&includerawconcentrations=1&API_KEY=${encodeURIComponent(opts.apiKey)}`;

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'user-agent': 'longwatch/airnow:v1' },
    });
  } catch (e) {
    // Deliberately does not read e.message — it embeds the URL, and the URL
    // carries the key.
    const aborted = (e as { name?: string })?.name === 'AbortError';
    return { ok: false, reason: aborted ? 'timeout' : 'network_error', http_status: null };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) return { ok: false, reason: 'http_error', http_status: res.status };

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    return { ok: false, reason: 'malformed_response', http_status: res.status };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, reason: 'malformed_response', http_status: res.status };
  }
  if (parsed.length === 0) {
    return { ok: false, reason: 'empty_response', http_status: res.status };
  }

  const records = parsed as AirNowRecord[];
  const names = new Set<string>();
  for (const r of records) {
    if (r && typeof r === 'object') Object.keys(r).forEach((k) => names.add(k));
  }
  return { ok: true, records, observed_field_names: [...names].sort() };
}

/** Hourly bucket, a separate namespace from the heartbeat's 10m: keys. */
export function periodKeyHour(d: Date): string {
  return `1h:${Math.floor(d.getTime() / (60 * 60 * 1000))}`;
}

/**
 * Series this instrument is meant to be watching.
 *
 * Explicit, not discovered. A series that stops writing must still appear on
 * the page and report stale — if the dashboard derived its list from rows
 * present, a dead series would silently vanish, which is precisely the
 * failure this ledger exists to make impossible.
 */
export const KNOWN_SERIES: { key: string; label: string }[] = [
  { key: 'lw.core.heartbeat', label: 'Instrument heartbeat' },
  { key: 'lw.external.http_probe', label: 'Outbound HTTP probe' },
  { key: 'lw.air.840371290002.pm25', label: 'AirNow PM2.5' },
  { key: 'lw.air.840371290002.ozone', label: 'AirNow ozone' },
  { key: 'lw.air.840371290002.pm10', label: 'AirNow PM10' },
];
