import type { TimeseriesPoint } from './types';

export interface Gap {
  /** When the first missing observation was expected */
  expected_at: string;
  /** Last observation before the gap */
  previous_at: string;
  /** Total length of this silence, in hours */
  duration_hours: number;
  /** How many observations were missed across this silence */
  missed_count: number;
  /** True when the silence runs to the end of the window (still ongoing) */
  ongoing: boolean;
}

/**
 * A contiguous run of observations, with the silence that follows it.
 *
 * The ratio alone ("83 of 28,627") reads like an instrument that has been
 * failing constantly for seven months. The shape says something different and
 * truer: it recorded continuously, stopped once, and resumed. Both facts come
 * from the same rows.
 */
export interface ObservationPeriod {
  start: string;
  end: string;
  /** Observations recorded in this run. */
  count: number;
  duration_hours: number;
  /** Silence following this run, in hours; null for the final run. */
  gap_after_hours: number | null;
  /** Observations missed during that silence; null for the final run. */
  gap_after_missed: number | null;
}

export interface ContinuityReport {
  /** Expected interval between observations, in hours */
  expected_interval_hours: number;
  /** Total observations that should have occurred across the window */
  total_expected: number;
  /** Observations actually present */
  total_observed: number;
  /** Continuity percentage (observed / expected × 100) */
  continuity_pct: number;
  /** Number of distinct silences */
  gap_count: number;
  /** Total observations missed across all silences */
  missed_total: number;
  /** Individual silences, longest first, capped at MAX_GAPS */
  gaps: Gap[];
  /** True when `gaps` was truncated for payload size */
  gaps_truncated: boolean;
  /** Longest single silence in hours */
  longest_gap_hours: number;
  /** Contiguous runs of observation, oldest first, with the silence after each */
  periods: ObservationPeriod[];
  window_start: string;
  window_end: string;
}

/** Payload guard: a 200-day silence at a 10-minute interval is ~28,000 slots. */
const MAX_GAPS = 50;

/**
 * Analyze a timeseries for observation gaps.
 *
 * @param timeseries            - sorted ascending by observed_at
 * @param expectedIntervalHours - expected spacing between consecutive observations
 * @param toleranceMultiplier   - a gap is flagged when the actual interval
 *                                exceeds expectedIntervalHours × toleranceMultiplier
 * @param windowEndIso          - optional explicit end of the observation window
 *
 * `windowEndIso` exists so the window can run to NOW rather than to the last
 * observation. Ending the window at the final data point makes an instrument
 * that stopped recording six months ago report 100% continuity, because the
 * silence falls outside the window it measures. That is the most misleading
 * thing this file could do, so the dashboard always passes `now`.
 *
 * Each contiguous silence is ONE Gap carrying `missed_count`, not one Gap per
 * missed slot — otherwise a long outage produces tens of thousands of objects.
 */
export function analyzeContinuity(
  timeseries: TimeseriesPoint[],
  expectedIntervalHours: number = 24,
  toleranceMultiplier: number = 1.5,
  windowEndIso?: string,
): ContinuityReport {
  const intervalMs = expectedIntervalHours * 60 * 60 * 1000;
  const thresholdMs = intervalMs * toleranceMultiplier;

  if (timeseries.length === 0) {
    const end = windowEndIso ?? '';
    return {
      expected_interval_hours: expectedIntervalHours,
      total_expected: 0,
      total_observed: 0,
      continuity_pct: 0,
      gap_count: 0,
      missed_total: 0,
      gaps: [],
      gaps_truncated: false,
      longest_gap_hours: 0,
      periods: [],
      window_start: end,
      window_end: end,
    };
  }

  const windowStart = new Date(timeseries[0].observed_at);
  const lastPoint = timeseries[timeseries.length - 1];
  const windowEnd = windowEndIso ? new Date(windowEndIso) : new Date(lastPoint.observed_at);
  const windowSpanMs = Math.max(0, windowEnd.getTime() - windowStart.getTime());

  const totalExpected = Math.round(windowSpanMs / intervalMs) + 1;

  const all: Gap[] = [];

  const record = (prevIso: string, prevMs: number, nextMs: number, ongoing: boolean) => {
    const deltaMs = nextMs - prevMs;
    if (deltaMs <= thresholdMs) return;
    const missed = Math.max(1, Math.round(deltaMs / intervalMs) - 1);
    all.push({
      expected_at: new Date(prevMs + intervalMs).toISOString(),
      previous_at: prevIso,
      duration_hours: Number((deltaMs / (60 * 60 * 1000)).toFixed(1)),
      missed_count: missed,
      ongoing,
    });
  };

  for (let i = 1; i < timeseries.length; i++) {
    record(
      timeseries[i - 1].observed_at,
      new Date(timeseries[i - 1].observed_at).getTime(),
      new Date(timeseries[i].observed_at).getTime(),
      false,
    );
  }

  // Trailing silence: the stretch from the last observation to the end of the
  // window. Without this, an instrument that stopped looks continuous right up
  // to the moment it died.
  record(
    lastPoint.observed_at,
    new Date(lastPoint.observed_at).getTime(),
    windowEnd.getTime(),
    true,
  );

  // Contiguous runs, split on the same threshold used for gaps.
  const periods: ObservationPeriod[] = [];
  let runStart = timeseries[0].observed_at;
  let runCount = 1;
  for (let i = 1; i < timeseries.length; i++) {
    const prevMs = new Date(timeseries[i - 1].observed_at).getTime();
    const currMs = new Date(timeseries[i].observed_at).getTime();
    if (currMs - prevMs > thresholdMs) {
      const gapMs = currMs - prevMs;
      periods.push({
        start: runStart,
        end: timeseries[i - 1].observed_at,
        count: runCount,
        duration_hours: Number(
          ((prevMs - new Date(runStart).getTime()) / 3600000).toFixed(1),
        ),
        gap_after_hours: Number((gapMs / 3600000).toFixed(1)),
        gap_after_missed: Math.max(1, Math.round(gapMs / intervalMs) - 1),
      });
      runStart = timeseries[i].observed_at;
      runCount = 1;
    } else {
      runCount++;
    }
  }
  {
    const lastMs = new Date(lastPoint.observed_at).getTime();
    const trailing = windowEnd.getTime() - lastMs;
    const open = trailing > thresholdMs;
    periods.push({
      start: runStart,
      end: lastPoint.observed_at,
      count: runCount,
      duration_hours: Number(
        ((lastMs - new Date(runStart).getTime()) / 3600000).toFixed(1),
      ),
      gap_after_hours: open ? Number((trailing / 3600000).toFixed(1)) : null,
      gap_after_missed: open ? Math.max(1, Math.round(trailing / intervalMs) - 1) : null,
    });
  }

  const missedTotal = all.reduce((sum, g) => sum + g.missed_count, 0);
  const longest = all.reduce((max, g) => Math.max(max, g.duration_hours), 0);

  const ranked = [...all].sort((a, b) => b.duration_hours - a.duration_hours);
  const gaps = ranked.slice(0, MAX_GAPS);

  const totalObserved = timeseries.length;
  const continuityPct =
    totalExpected > 0 ? Number(((totalObserved / totalExpected) * 100).toFixed(1)) : 0;

  return {
    expected_interval_hours: expectedIntervalHours,
    total_expected: totalExpected,
    total_observed: totalObserved,
    continuity_pct: Math.min(continuityPct, 100),
    gap_count: all.length,
    missed_total: missedTotal,
    gaps,
    gaps_truncated: ranked.length > gaps.length,
    longest_gap_hours: longest,
    periods,
    window_start: timeseries[0].observed_at,
    window_end: windowEnd.toISOString(),
  };
}
