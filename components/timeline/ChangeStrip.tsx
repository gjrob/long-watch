import type { AnomalyItem } from '@/lib/types';

interface ChangeStripProps {
  anomalies: AnomalyItem[];
}

export default function ChangeStrip({ anomalies }: ChangeStripProps) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const markers = Array.from({ length: 30 }).map((_, i) => i);

  // Map anomalies to day indices (0 = 30 days ago, 29 = today)
  const anomalyDays = new Set(
    anomalies
      .map((a) => {
        const daysAgo = Math.floor((now - new Date(a.detected_at).getTime()) / dayMs);
        return 29 - daysAgo;
      })
      .filter((d) => d >= 0 && d < 30)
  );

  return (
    <div>
      <div className="text-sm font-semibold">Change Timeline</div>
      <div className="mt-1 text-xs text-[#9AA4B2]">Last 30 days</div>

      <div className="mt-4 flex items-center gap-1">
        <div className="h-px flex-1 bg-[#2A3242]" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        {markers.map((i) => {
          const isAnomaly = anomalyDays.has(i);
          const daysAgo = 29 - i;
          return (
            <div
              key={i}
              title={
                isAnomaly
                  ? `${daysAgo}d ago · deviation detected · logged`
                  : `${daysAgo}d ago · normal`
              }
              className={
                isAnomaly
                  ? 'h-2 w-2 rounded-full border border-[#D4A373] bg-transparent'
                  : 'h-1.5 w-1.5 rounded-full bg-[#2A3242]'
              }
            />
          );
        })}
      </div>

      <div className="mt-4 text-xs text-[#9AA4B2]">
        Hover markers for details.
      </div>
    </div>
  );
}
