import type { Continuity } from '@/lib/types';
import { humanDuration, utcStamp } from '@/lib/format';

/**
 * The shape of the record, not just the ratio.
 *
 * "83 of 28,627 expected" is accurate and reads like an instrument that has
 * been failing constantly since January. What actually happened is one clean
 * stop and one resumption. Both come from the same heartbeat rows; this shows
 * the second fact without softening the first. The percentage is unchanged and
 * the window is not narrowed — only the story it summarises is made visible.
 */
export default function ObservationRecord({ continuity }: { continuity: Continuity }) {
  const periods = continuity.periods;
  if (periods.length === 0) {
    return <div className="text-sm text-[#9AA4B2]">No observations recorded.</div>;
  }

  // Proportional bar across the full window so the silence is visibly the
  // dominant span rather than one line item among many.
  const startMs = new Date(continuity.window_start).getTime();
  const endMs = new Date(continuity.window_end).getTime();
  const span = Math.max(1, endMs - startMs);
  const pctOf = (ms: number) => Math.max(0.4, (ms / span) * 100);

  return (
    <div>
      <div className="text-sm font-semibold">Observation Record</div>
      <div className="mt-1 text-xs text-[#6B7280]">
        {utcStamp(continuity.window_start)} → now · derived from{' '}
        <span className="font-mono">lw.core.heartbeat</span>
      </div>

      {/* Shape bar */}
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[#2A3242]">
        {periods.map((p, i) => {
          const runMs = new Date(p.end).getTime() - new Date(p.start).getTime();
          const gapMs = (p.gap_after_hours ?? 0) * 3600000;
          return (
            <span key={i} className="flex h-full" style={{ width: `${pctOf(runMs + gapMs)}%` }}>
              <span
                className="h-full bg-[#E6EAF2]"
                style={{ width: `${(runMs / Math.max(1, runMs + gapMs)) * 100}%` }}
                title={`recording: ${p.count} observations`}
              />
              <span
                className="h-full bg-[#D4A373]/25"
                style={{ width: `${(gapMs / Math.max(1, runMs + gapMs)) * 100}%` }}
                title={p.gap_after_hours ? `silent ${humanDuration(p.gap_after_hours)}` : ''}
              />
            </span>
          );
        })}
      </div>

      <ol className="mt-4 space-y-3">
        {periods.map((p, i) => (
          <li key={i}>
            <div className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E6EAF2]" />
              <div className="min-w-0">
                <div className="text-sm text-[#E6EAF2]">
                  Recorded {p.count.toLocaleString()}{' '}
                  {p.count === 1 ? 'observation' : 'observations'}
                  {p.duration_hours > 0 && (
                    <span className="text-[#9AA4B2]"> over {humanDuration(p.duration_hours)}</span>
                  )}
                </div>
                <div className="font-mono text-xs text-[#6B7280]">
                  {utcStamp(p.start)}
                  {p.end !== p.start && <> → {utcStamp(p.end)}</>}
                </div>
              </div>
            </div>

            {p.gap_after_hours !== null && (
              <div className="mt-2 flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A373]" />
                <div className="text-sm text-[#D4A373]">
                  Silent for {humanDuration(p.gap_after_hours)}
                  <span className="text-[#9AA4B2]">
                    {' '}
                    — {p.gap_after_missed?.toLocaleString()} observations not recorded
                  </span>
                  <div className="text-xs text-[#6B7280]">
                    Nothing was written for this span, and nothing has been written into it since.
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
