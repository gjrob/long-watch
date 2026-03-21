export interface LatestSignal {
  observed_at: string;
  signal_value: number;
  temperature_value: number;
  environment_value: number;
  integrity_flag: boolean;
  batch_hash: string;
}

export interface AnomalyItem {
  detected_at: string;
  sigma: number;
  status: string;
  description: string;
}

export interface LedgerSnapshot {
  row_count: number;
  head_hash: string;
  genesis_hash: string;
  merkle_root: string;
  chain_depth: number;
  chain_verified: boolean;
  mutation_attempts: number;
}

export interface TimeseriesPoint {
  observed_at: string;
  signal_value: number;
  temperature_value: number;
  environment_value: number;
}

export interface LedgerEntryPublic {
  index: number;
  observed_at: string;
  prev_hash: string;
  current_hash: string;
}

export interface DeltaValues {
  signal_24h: number;
  signal_7d: number;
  temperature_24h: number;
  temperature_7d: number;
}

export interface ContinuityGap {
  expected_at: string;
  previous_at: string;
  duration_hours: number;
}

export interface Continuity {
  expected_interval_hours: number;
  total_expected: number;
  total_observed: number;
  continuity_pct: number;
  gap_count: number;
  gaps: ContinuityGap[];
  longest_gap_hours: number;
  window_start: string;
  window_end: string;
}

export interface ExternalAnchorPublic {
  chain_index: number;
  anchored_at: string;
  internal_hash: string;
  /** 'bitcoin', 'bitcoin+rekor', or 'simulated' */
  external_source: string;
  /** For real: btc_hash or btc_hash|rekor_root_hash. For simulated: deterministic hash. */
  external_reference: string;
  external_height: number;
  binding_hash: string;
  binding_verified: boolean;
  external_verifiable: boolean;
  /** Present only on real dual-source anchors */
  rekor_root_hash?: string;
  /** Present only on real dual-source anchors */
  rekor_tree_size?: number;
}

export interface Anchoring {
  anchor_count: number;
  anchor_interval: number;
  verified: boolean;
  anchor_coverage: number;
  real_anchor_present: boolean;
  /** First UTC date with a persisted real anchor, or null if none exist */
  anchoring_start_date: string | null;
  anchors: ExternalAnchorPublic[];
}

export interface DashboardData {
  latest: LatestSignal;
  anomalies: AnomalyItem[];
  ledger: LedgerSnapshot;
  /** Last 8 chain entries (most recent first) for UI display */
  ledger_tail: LedgerEntryPublic[];
  timeseries: TimeseriesPoint[];
  delta: DeltaValues;
  continuity: Continuity;
  anchoring: Anchoring;
  stability_days: number;
  fetched_at: string;
}
