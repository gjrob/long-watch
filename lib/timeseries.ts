import type { TimeseriesPoint, AnomalyItem } from './types';

/** Deterministic pseudo-random from a seed */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Day indices that are deterministically dropped to simulate observation gaps.
 * Fixed offsets from the start of the window.
 */
const DROPPED_DAY_INDICES = new Set([7, 8, 19]);

/**
 * Generate a deterministic timeseries.
 *
 * All timestamps are normalized to midnight UTC so the chain is identical
 * across requests within the same UTC day. This is critical for Merkle root
 * consistency between the dashboard and verification endpoints.
 */
export function generateTimeseries(days: number = 30): TimeseriesPoint[] {
  // Normalize "now" to midnight UTC
  const now = new Date();
  const todayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const points: TimeseriesPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const dayIndex = days - i;

    if (DROPPED_DAY_INDICES.has(dayIndex)) continue;

    const date = new Date(todayMidnight - i * 24 * 60 * 60 * 1000);
    const seed = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
    const r = seededRandom(seed);

    const signal = 100.0 - dayIndex * 0.008 + (r - 0.5) * 0.4;
    const temp = 20.0 + Math.sin(dayIndex * 0.21) * 1.8 + (r - 0.5) * 0.6;
    const env = 0.50 + (r - 0.5) * 0.08;

    points.push({
      observed_at: date.toISOString(),
      signal_value: Number(signal.toFixed(4)),
      temperature_value: Number(temp.toFixed(4)),
      environment_value: Number(env.toFixed(4)),
    });
  }

  return points;
}

export function generateAnomalies(): AnomalyItem[] {
  const now = new Date();
  const todayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return [
    {
      detected_at: new Date(todayMidnight - 8 * 24 * 60 * 60 * 1000).toISOString(),
      sigma: 2.3,
      status: 'auto-resolved',
      description: 'Transient deviation (+2.3σ)',
    },
    {
      detected_at: new Date(todayMidnight - 17 * 24 * 60 * 60 * 1000).toISOString(),
      sigma: 1.1,
      status: 'within tolerance',
      description: 'Baseline drift detected',
    },
    {
      detected_at: new Date(todayMidnight - 22 * 24 * 60 * 60 * 1000).toISOString(),
      sigma: 0.0,
      status: 'no deviation detected',
      description: 'Scheduled verification pass',
    },
    {
      detected_at: new Date(todayMidnight - 35 * 24 * 60 * 60 * 1000).toISOString(),
      sigma: 1.8,
      status: 'auto-resolved',
      description: 'Environmental noise spike (+1.8σ)',
    },
    {
      detected_at: new Date(todayMidnight - 51 * 24 * 60 * 60 * 1000).toISOString(),
      sigma: 2.7,
      status: 'auto-resolved',
      description: 'Transient deviation (+2.7σ)',
    },
  ];
}
