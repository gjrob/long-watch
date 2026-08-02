import type { Continuity } from '@/lib/types';
import { humanDuration } from '@/lib/format';

/**
 * Continuity over the whole recorded history, with the window ending NOW.
 * Ending it at the last observation would have made a dead instrument read
 * 100%.
 */
export default function ContinuityStatus({ continuity }: { continuity: Continuity }) {
  const pct = continuity.continuity_pct;
  const ongoing = continuity.gaps.find((g) => g.ongoing);

  return (
    <div className="rounded-md bg-[#1A2030] p-4">
      <div className="text-xs text-[#9AA4B2]">Observation Continuity</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-lg font-semibold text-[#E6EAF2]">{pct}%</span>
        <span className="text-xs text-[#9AA4B2]">
          {continuity.total_observed.toLocaleString()} of{' '}
          {continuity.total_expected.toLocaleString()} expected
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-[#2A3242]">
        <div
          className="h-full rounded-full bg-[#D4A373]"
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-[#6B7280]">
        <span>Interval: {Math.round(continuity.expected_interval_hours * 60)} min</span>
        <span>
          {continuity.gap_count === 0
            ? 'No gaps'
            : `${continuity.gap_count} ${continuity.gap_count === 1 ? 'gap' : 'gaps'} · ${continuity.missed_total.toLocaleString()} missed`}
        </span>
      </div>

      {ongoing && (
        <div className="mt-3 rounded border border-[#D4A373]/30 bg-[#D4A373]/5 px-3 py-2 text-xs text-[#D4A373]">
          Ongoing gap: {humanDuration(ongoing.duration_hours)} with no observation.
        </div>
      )}
    </div>
  );
}
