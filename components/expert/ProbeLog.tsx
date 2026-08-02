import type { ProbePoint } from '@/lib/types';
import { utcStamp } from '@/lib/format';

/**
 * The only genuinely numeric series this ledger records: latency and status
 * of the outbound HTTP probe, read from value_json. The former Signal /
 * Temperature / Environment charts plotted columns that do not exist.
 */
export default function ProbeLog({ points }: { points: ProbePoint[] }) {
  if (points.length === 0) {
    return <div className="text-sm text-[#9AA4B2]">No probe observations recorded.</div>;
  }
  const recent = [...points].reverse().slice(0, 12);
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-[#6B7280]">
        <tr>
          <th className="pb-2 font-normal">Observed</th>
          <th className="pb-2 font-normal">HTTP</th>
          <th className="pb-2 font-normal">Latency</th>
          <th className="pb-2 font-normal">Result</th>
        </tr>
      </thead>
      <tbody className="text-[#E6EAF2]">
        {recent.map((p) => (
          <tr key={p.observed_at} className="border-t border-[#2A3242]">
            <td className="py-2 font-mono">{utcStamp(p.observed_at)}</td>
            <td className="py-2">{p.status ?? '—'}</td>
            <td className="py-2">{p.latency_ms === null ? '—' : `${p.latency_ms} ms`}</td>
            <td className={`py-2 ${p.ok ? 'text-[#9AA4B2]' : 'text-[#D4A373]'}`}>
              {p.ok ? 'ok' : 'failed'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
