import type { ObservingState, SeriesSummary } from '@/lib/types';
import { humanAge } from '@/lib/format';

interface PublicSummaryProps {
  observing: ObservingState;
  series: SeriesSummary[];
}

/**
 * "Monitoring continues automatically" was the previous copy here. It was
 * false for six months. What this says now is derived from `observing`.
 */
export default function PublicSummary({ observing, series }: PublicSummaryProps) {
  return (
    <div className="grid gap-3">
      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">What&apos;s recorded</div>
        {series.length === 0 ? (
          <div className="mt-2 text-sm text-[#9AA4B2]">No series have any rows.</div>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-[#E6EAF2]">
            {series.map((s) => (
              <li key={s.series_key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs">{s.series_key}</span>
                  <span className={`text-xs ${s.is_stale ? 'text-[#D4A373]' : 'text-[#9AA4B2]'}`}>
                    {s.snapshot_count === 0
                      ? 'no measurement ever'
                      : `last measurement ${humanAge(s.age_seconds)}`}
                    {s.is_stale && s.snapshot_count > 0 ? ' · STALE' : ''}
                  </span>
                </div>
                <div className="text-xs text-[#6B7280]">
                  {s.label} · {s.snapshot_count.toLocaleString()} measurement
                  {s.snapshot_count === 1 ? '' : 's'}
                  {s.count > s.snapshot_count
                    ? ` · ${(s.count - s.snapshot_count).toLocaleString()} checked-no-answer`
                    : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md bg-[#1A2030] p-4">
        <div className="text-xs text-[#9AA4B2]">What it means</div>
        <div className="mt-2 text-sm text-[#E6EAF2]">
          {observing.is_observing
            ? 'The scheduled writer is recording on time.'
            : 'The scheduled writer is not recording. This page reports that rather than estimating what the missing observations would have been.'}
        </div>
      </div>
    </div>
  );
}
