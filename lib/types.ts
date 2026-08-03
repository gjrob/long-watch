/**
 * Types for The Long Watch dashboard.
 *
 * Every field here must be answerable by a query against `signals` or
 * `anomalies`. Fields that had no source in the database — signal_value,
 * temperature_value, environment_value, sigma-scored anomalies, simulated
 * merkle roots and anchors — were removed rather than kept and filled with
 * generated values.
 */

/** One row of the real `signals` table, as displayed. */
export interface Observation {
  id: string;
  observed_at: string;
  series_key: string;
  source: string | null;
  signal_type: string | null;
  row_hash: string;
  prev_hash: string | null;
  period_key: string | null;
  value_json: unknown;
}

/** Per-series rollup: how many rows, and how long since the last one. */
export interface SeriesSummary {
  series_key: string;
  label: string;
  /** Total rows, including no_reading. */
  count: number;
  /** Rows that are actual measurements. Drives freshness. */
  snapshot_count: number;
  first_observed_at: string | null;
  /** Newest signal_type='snapshot' row. NOT the newest row of any type. */
  last_observed_at: string | null;
  /** Seconds since the last SNAPSHOT. A run of no_reading rows does not reset it. */
  age_seconds: number | null;
  /** True when the newest snapshot is older than the series' expected interval. */
  is_stale: boolean;
}

/**
 * Whether the instrument is currently watching.
 *
 * `is_observing` is false when the newest observation is older than
 * `stale_after_seconds`. There is no third state and no optimistic default:
 * if we cannot read the table, this is false.
 */
export interface ObservingState {
  is_observing: boolean;
  last_observed_at: string | null;
  age_seconds: number | null;
  expected_interval_seconds: number;
  stale_after_seconds: number;
}

export interface AnomalyRecord {
  id: string;
  observed_at: string;
  series_key: string | null;
  severity: string | null;
  kind: string | null;
  message: string | null;
}

export interface LedgerSnapshot {
  /** Total rows in `signals`. */
  row_count: number;
  /** row_hash of the newest observation, or null if the table is empty. */
  head_hash: string | null;
  /** row_hash of the oldest observation. */
  genesis_hash: string | null;
  /** Distinct series_key count. */
  series_count: number;
}

export interface LedgerEntryPublic {
  observed_at: string;
  series_key: string;
  prev_hash: string | null;
  row_hash: string;
}

export interface ContinuityGap {
  expected_at: string;
  previous_at: string;
  duration_hours: number;
  missed_count: number;
  /** True when the silence runs to the end of the window (still ongoing). */
  ongoing: boolean;
}

export interface ObservationPeriod {
  start: string;
  end: string;
  count: number;
  duration_hours: number;
  gap_after_hours: number | null;
  gap_after_missed: number | null;
}

export interface Continuity {
  expected_interval_hours: number;
  total_expected: number;
  total_observed: number;
  continuity_pct: number;
  gap_count: number;
  missed_total: number;
  gaps: ContinuityGap[];
  gaps_truncated: boolean;
  longest_gap_hours: number;
  periods: ObservationPeriod[];
  window_start: string;
  window_end: string;
}

/** Real numeric series: latency of the outbound HTTP probe. */
export interface ProbePoint {
  observed_at: string;
  latency_ms: number | null;
  status: number | null;
  ok: boolean;
}

export interface DashboardData {
  observing: ObservingState;
  latest: Observation | null;
  series: SeriesSummary[];
  anomalies: AnomalyRecord[];
  ledger: LedgerSnapshot;
  ledger_tail: LedgerEntryPublic[];
  probe: ProbePoint[];
  continuity: Continuity;
  /** Time the request was served. Explicitly NOT an observation time. */
  fetched_at: string;
  /** Populated when a query failed, so the UI can say so instead of guessing. */
  error: string | null;
}

/** Kept for the timeseries shape used by continuity analysis. */
export interface TimeseriesPoint {
  observed_at: string;
}
