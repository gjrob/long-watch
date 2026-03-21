import type { Continuity } from '@/lib/types';

interface ContinuityStatusProps {
  continuity: Continuity;
}

export default function ContinuityStatus({ continuity }: ContinuityStatusProps) {
  return (
    <div className="rounded-md bg-[#1A2030] p-4">
      <div className="text-xs text-[#9AA4B2]">Observation Continuity</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-lg font-semibold text-[#E6EAF2]">{continuity.continuity_pct}%</span>
        <span className="text-xs text-[#9AA4B2]">
          {continuity.total_observed} of {continuity.total_expected} expected
        </span>
      </div>

      {/* Continuity bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-[#2A3242]">
        <div
          className="h-full rounded-full bg-[#4A5568]"
          style={{ width: `${continuity.continuity_pct}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-[#6B7280]">
        <span>Interval: {continuity.expected_interval_hours}h</span>
        <span>
          {continuity.gap_count === 0
            ? 'No gaps detected'
            : `${continuity.gap_count} ${continuity.gap_count === 1 ? 'gap' : 'gaps'} detected`}
        </span>
      </div>
    </div>
  );
}
