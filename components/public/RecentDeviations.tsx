import type { AnomalyRecord } from '@/lib/types';
import { utcStamp } from '@/lib/format';

interface RecentDeviationsProps {
  anomalies: AnomalyRecord[];
}

/**
 * Reads the `anomalies` table. That table has zero rows, and zero is the
 * answer this renders — previously it displayed five entries produced by
 * generateAnomalies() at fixed day-offsets from today, so the "recent
 * deviations" advanced by one day every day and had never been detected.
 */
export default function RecentDeviations({ anomalies }: RecentDeviationsProps) {
  return (
    <div>
      <div className="text-sm font-semibold">Recorded Anomalies</div>

      {anomalies.length === 0 ? (
        <div className="mt-3 rounded-md bg-[#1A2030] px-3 py-4 text-sm text-[#9AA4B2]">
          No anomalies recorded.
          <div className="mt-1 text-xs text-[#6B7280]">
            The anomalies table is empty. Nothing has been detected and logged.
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {anomalies.slice(0, 5).map((a) => (
            <div key={a.id} className="rounded-md bg-[#1A2030] px-3 py-2.5">
              <div className="text-xs text-[#9AA4B2]">{utcStamp(a.observed_at)}</div>
              <div className="mt-0.5 text-sm text-[#E6EAF2]">
                {a.kind ?? 'anomaly'}
                {a.message ? <span className="text-[#9AA4B2]"> — {a.message}</span> : null}
              </div>
              <div className="mt-0.5 text-xs text-[#6B7280]">
                {a.series_key ?? '—'}
                {a.severity ? ` · ${a.severity}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
