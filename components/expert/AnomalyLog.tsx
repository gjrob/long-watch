import type { AnomalyItem } from '@/lib/types';

interface AnomalyLogProps {
  items: AnomalyItem[];
}

export default function AnomalyLog({ items }: AnomalyLogProps) {
  if (!items?.length) {
    return <div className="text-sm text-[#9AA4B2]">No recent anomalies.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((a, idx) => (
        <div key={idx} className="rounded-md bg-[#1A2030] p-3">
          <div className="flex items-center justify-between text-xs text-[#9AA4B2]">
            <span>{new Date(a.detected_at).toISOString().slice(0, 19)}Z</span>
            <span>{a.status}</span>
          </div>
          <div className="mt-1 text-sm text-[#E6EAF2]">
            {a.description}
            {a.sigma > 0 && <span className="ml-1.5 text-xs text-[#9AA4B2]">({a.sigma.toFixed(1)}σ)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
