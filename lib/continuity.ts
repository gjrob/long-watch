import type { TimeseriesPoint } from './types';

export interface Gap {
  /** When the missing observation was expected */
  expected_at: string;
  /** Last observation before the gap */
  previous_at: string;
  /** Gap duration in hours */
  duration_hours: number;
  /** How many observations were missed in this gap */
  missed_count: number;
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
  /** Number of detected gaps */
  gap_count: number;
  /** Individual gap records */
  gaps: Gap[];
  /** Longest single gap in hours */
  longest_gap_hours: number;
  /** Window start */
  window_start: string;
  /** Window end */
  window_end: string;
}

/**
 * Analyze a timeseries for observation gaps.
 *
 * @param timeseries  - sorted ascending by observed_at
 * @param expectedIntervalHours - expected spacing between consecutive observations
 * @param toleranceMultiplier   - a gap is flagged when actual interval exceeds
 *                                expectedIntervalHours × toleranceMultiplier
 */
export function analyzeContinuity(
  timeseries: TimeseriesPoint[],
  expectedIntervalHours: number = 24,
  toleranceMultiplier: number = 1.5,
): ContinuityReport {
  if (timeseries.length < 2) {
    return {
      expected_interval_hours: expectedIntervalHours,
      total_expected: timeseries.length,
      total_observed: timeseries.length,
      continuity_pct: 100,
      gap_count: 0,
      gaps: [],
      longest_gap_hours: 0,
      window_start: timeseries[0]?.observed_at ?? '',
      window_end: timeseries[0]?.observed_at ?? '',
    };
  }

  const intervalMs = expectedIntervalHours * 60 * 60 * 1000;
  const thresholdMs = intervalMs * toleranceMultiplier;

  const windowStart = new Date(timeseries[0].observed_at);
  const windowEnd = new Date(timeseries[timeseries.length - 1].observed_at);
  const windowSpanMs = windowEnd.getTime() - windowStart.getTime();

  // Total expected = number of intervals that fit in the window + 1 (for the first point)
  const totalExpected = Math.round(windowSpanMs / intervalMs) + 1;

  const gaps: Gap[] = [];
  let longestGapHours = 0;

  for (let i = 1; i < timeseries.length; i++) {
    const prevTime = new Date(timeseries[i - 1].observed_at).getTime();
    const currTime = new Date(timeseries[i].observed_at).getTime();
    const deltaMs = currTime - prevTime;

    if (deltaMs > thresholdMs) {
      const durationHours = Number((deltaMs / (60 * 60 * 1000)).toFixed(1));
      const missedCount = Math.round(deltaMs / intervalMs) - 1;

      // Generate expected timestamps for each missed slot
      for (let m = 1; m <= missedCount; m++) {
        const expectedTime = new Date(prevTime + m * intervalMs);
        gaps.push({
          expected_at: expectedTime.toISOString(),
          previous_at: timeseries[i - 1].observed_at,
          duration_hours: Number((intervalMs / (60 * 60 * 1000)).toFixed(1)),
          missed_count: 1,
        });
      }

      if (durationHours > longestGapHours) {
        longestGapHours = durationHours;
      }
    }
  }

  const totalObserved = timeseries.length;
  const continuityPct = totalExpected > 0
    ? Number(((totalObserved / totalExpected) * 100).toFixed(1))
    : 100;

  return {
    expected_interval_hours: expectedIntervalHours,
    total_expected: totalExpected,
    total_observed: totalObserved,
    continuity_pct: Math.min(continuityPct, 100),
    gap_count: gaps.length,
    gaps,
    longest_gap_hours: longestGapHours,
    window_start: timeseries[0].observed_at,
    window_end: timeseries[timeseries.length - 1].observed_at,
  };
}
