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
          <ul className="mt-2 space-y-1 text-sm text-[#E6EAF2]">
            {series.map((s) => (
              <li key={s.series_key} className="flex justify-between gap-3">
                <span className="font-mono text-xs">{s.series_key}</span>
                <span className="text-xs text-[#9AA4B2]">
                  {s.count.toLocaleString()} rows · last {humanAge(s.age_seconds)}
                </span>
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
