import type { DashboardData } from '@/lib/types';
import { buildChain } from '@/lib/ledger';
import { analyzeContinuity } from '@/lib/continuity';
import { generateAnchors, applyRealAnchor, verifyAnchors } from '@/lib/anchoring';
import { buildMerkleTree } from '@/lib/merkle';
import { getOrCreateDailyAnchor } from '@/lib/anchorRotation';
import { getAnchoringStartDate } from '@/lib/anchorStore';
import { generateTimeseries, generateAnomalies } from '@/lib/timeseries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const timeseries = generateTimeseries(30);
  const anomalies = generateAnomalies();

  // 1) Build chain
  const chain = buildChain(timeseries);

  // Continuity analysis — expected interval: 24h
  const continuityReport = analyzeContinuity(timeseries, 24);
  const continuity = {
    expected_interval_hours: continuityReport.expected_interval_hours,
    total_expected: continuityReport.total_expected,
    total_observed: continuityReport.total_observed,
    continuity_pct: continuityReport.continuity_pct,
    gap_count: continuityReport.gap_count,
    gaps: continuityReport.gaps.map((g) => ({
      expected_at: g.expected_at,
      previous_at: g.previous_at,
      duration_hours: g.duration_hours,
    })),
    longest_gap_hours: continuityReport.longest_gap_hours,
    window_start: continuityReport.window_start,
    window_end: continuityReport.window_end,
  };

  const latest = timeseries[timeseries.length - 1];

  const lastSignificant = anomalies.find((a) => a.sigma >= 2.0);
  const stabilityDays = lastSignificant
    ? Math.floor((now.getTime() - new Date(lastSignificant.detected_at).getTime()) / (24 * 60 * 60 * 1000))
    : 30;

  const todayPoint = timeseries[timeseries.length - 1];
  const yesterdayPoint = timeseries[timeseries.length - 2] ?? todayPoint;
  const weekAgoPoint = timeseries[Math.max(0, timeseries.length - 8)] ?? todayPoint;

  const delta = {
    signal_24h: Number((todayPoint.signal_value - yesterdayPoint.signal_value).toFixed(4)),
    signal_7d: Number((todayPoint.signal_value - weekAgoPoint.signal_value).toFixed(4)),
    temperature_24h: Number((todayPoint.temperature_value - yesterdayPoint.temperature_value).toFixed(4)),
    temperature_7d: Number((todayPoint.temperature_value - weekAgoPoint.temperature_value).toFixed(4)),
  };

  const tail = chain.entries
    .slice(-8)
    .reverse()
    .map((e) => ({
      index: e.index,
      observed_at: e.observed_at,
      prev_hash: e.prev_hash,
      current_hash: e.current_hash,
    }));

  // Merkle tree from chain hashes
  const chainHashes = chain.entries.map((e) => e.current_hash);
  const merkle = buildMerkleTree(chainHashes);

  // 2) Generate all-simulated anchors
  let anchors = generateAnchors(chain.entries, 7);

  // 3) Get or create today's real anchor (fail-soft)
  let realAnchor = null;
  try {
    realAnchor = await getOrCreateDailyAnchor(chain.entries, 7);
  } catch {
    realAnchor = null;
  }

  // 4) Inject real anchor into simulated array
  anchors = applyRealAnchor(anchors, realAnchor);

  // 5) Verify all anchors
  const verification = verifyAnchors(anchors);

  // 6) Anchoring start date
  let anchoringStartDate: string | null = null;
  try {
    anchoringStartDate = await getAnchoringStartDate();
  } catch {
    anchoringStartDate = null;
  }

  const anchoring = {
    anchor_count: anchors.length,
    anchor_interval: 7,
    verified: verification.all_verified,
    anchor_coverage: anchors.length / chain.entries.length,
    real_anchor_present: Boolean(realAnchor),
    anchoring_start_date: anchoringStartDate,
    anchors,
  };

  const data: DashboardData = {
    latest: {
      observed_at: now.toISOString(),
      signal_value: latest.signal_value,
      temperature_value: latest.temperature_value,
      environment_value: latest.environment_value,
      integrity_flag: chain.verified,
      batch_hash: chain.head_hash.slice(0, 16),
    },
    anomalies,
    ledger: {
      row_count: chain.depth,
      head_hash: chain.head_hash,
      genesis_hash: chain.genesis_hash,
      merkle_root: merkle.root,
      chain_depth: chain.depth,
      chain_verified: chain.verified,
      mutation_attempts: 0,
    },
    ledger_tail: tail,
    timeseries,
    delta,
    continuity,
    anchoring,
    stability_days: stabilityDays,
    fetched_at: now.toISOString(),
  };

  return Response.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
