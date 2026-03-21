import type { AnomalyItem } from '@/lib/types';

interface RecentDeviationsProps {
  anomalies: AnomalyItem[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentDeviations({ anomalies }: RecentDeviationsProps) {
  const recent = anomalies.slice(0, 5);

  return (
    <div>
      <div className="text-sm font-semibold">Recent Deviations</div>
      <div className="mt-3 space-y-2">
        {recent.map((a, i) => (
          <div key={i} className="flex items-start justify-between rounded-md bg-[#1A2030] px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-[#9AA4B2]">{formatDate(a.detected_at)}</div>
              <div className="mt-0.5 text-sm text-[#E6EAF2]">
                {a.description}
                {a.sigma > 0 && (
                  <span className="ml-1.5 text-xs text-[#9AA4B2]">({a.sigma.toFixed(1)}σ)</span>
                )}
              </div>
            </div>
            <div className="ml-3 shrink-0 text-xs text-[#9AA4B2]">{a.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
