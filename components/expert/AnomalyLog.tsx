import type { AnomalyRecord } from '@/lib/types';
import { utcStamp } from '@/lib/format';

export default function AnomalyLog({ items }: { items: AnomalyRecord[] }) {
  if (items.length === 0) {
    return <div className="text-sm text-[#9AA4B2]">No anomalies recorded.</div>;
  }
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-[#6B7280]">
        <tr>
          <th className="pb-2 font-normal">Observed</th>
          <th className="pb-2 font-normal">Series</th>
          <th className="pb-2 font-normal">Kind</th>
          <th className="pb-2 font-normal">Severity</th>
        </tr>
      </thead>
      <tbody className="text-[#E6EAF2]">
        {items.map((a) => (
          <tr key={a.id} className="border-t border-[#2A3242]">
            <td className="py-2 font-mono">{utcStamp(a.observed_at)}</td>
            <td className="py-2 font-mono text-[#9AA4B2]">{a.series_key ?? '—'}</td>
            <td className="py-2">{a.kind ?? '—'}</td>
            <td className="py-2 text-[#9AA4B2]">{a.severity ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
