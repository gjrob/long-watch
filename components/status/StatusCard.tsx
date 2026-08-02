import type { ObservingState } from '@/lib/types';
import { humanAge, utcStamp } from '@/lib/format';

interface StatusCardProps {
  observing: ObservingState;
}

/**
 * The instrument's own state, stated first and stated plainly.
 *
 * This card used to read STABLE whenever `integrity_flag` was truthy, and
 * integrity_flag was computed over a generated chain — so it read STABLE for
 * the six months nothing was recorded. "Stable" is a claim about observations.
 * With no current observations there is nothing to be stable about, and the
 * honest state is NOT OBSERVING.
 */
export default function StatusCard({ observing }: StatusCardProps) {
  const { is_observing, last_observed_at, age_seconds } = observing;

  const label = is_observing ? 'OBSERVING' : 'NOT OBSERVING';
  const sub = is_observing
    ? 'Observations are arriving on schedule.'
    : last_observed_at
      ? 'The writer has stopped. Nothing has been recorded since the timestamp below.'
      : 'No observations have ever been recorded.';

  return (
    <div>
      <div
        className={`text-5xl font-semibold tracking-tight ${
          is_observing ? 'text-[#E6EAF2]' : 'text-[#D4A373]'
        }`}
      >
        {label}
      </div>
      <div className="mt-2 text-sm text-[#9AA4B2]">{sub}</div>

      <div className="mt-4 rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">Last observation</div>
        <div className="mt-1 text-lg font-semibold text-[#E6EAF2]">
          {humanAge(age_seconds)}
        </div>
        <div className="mt-1 font-mono text-xs text-[#6B7280]">
          {utcStamp(last_observed_at)}
        </div>
      </div>

      <div className="mt-3 text-xs text-[#6B7280]">
        Expected every {Math.round(observing.expected_interval_seconds / 60)} minutes ·
        considered stopped after {Math.round(observing.stale_after_seconds / 60)} minutes
      </div>
    </div>
  );
}
