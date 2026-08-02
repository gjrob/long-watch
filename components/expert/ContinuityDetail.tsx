import type { Continuity } from '@/lib/types';
import { humanDuration, utcStamp } from '@/lib/format';

export default function ContinuityDetail({ continuity }: { continuity: Continuity }) {
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2 text-[#9AA4B2]">
        <div>Window start<div className="font-mono text-[#E6EAF2]">{utcStamp(continuity.window_start)}</div></div>
        <div>Window end<div className="font-mono text-[#E6EAF2]">{utcStamp(continuity.window_end)}</div></div>
        <div>Expected<div className="text-[#E6EAF2]">{continuity.total_expected.toLocaleString()}</div></div>
        <div>Observed<div className="text-[#E6EAF2]">{continuity.total_observed.toLocaleString()}</div></div>
        <div>Missed<div className="text-[#E6EAF2]">{continuity.missed_total.toLocaleString()}</div></div>
        <div>Longest gap<div className="text-[#E6EAF2]">{humanDuration(continuity.longest_gap_hours)}</div></div>
      </div>

      {continuity.gaps.length === 0 ? (
        <div className="text-[#9AA4B2]">No gaps detected.</div>
      ) : (
        <div>
          <div className="text-[#9AA4B2]">
            Gaps, longest first{continuity.gaps_truncated ? ' (truncated)' : ''}
          </div>
          <table className="mt-2 w-full text-left">
            <thead className="text-[#6B7280]">
              <tr>
                <th className="pb-1 font-normal">Silence began after</th>
                <th className="pb-1 font-normal">Duration</th>
                <th className="pb-1 font-normal">Missed</th>
              </tr>
            </thead>
            <tbody className="text-[#E6EAF2]">
              {continuity.gaps.map((g, i) => (
                <tr key={i} className="border-t border-[#2A3242]">
                  <td className="py-1.5 font-mono">{utcStamp(g.previous_at)}</td>
                  <td className="py-1.5">
                    {humanDuration(g.duration_hours)}
                    {g.ongoing && <span className="ml-1 text-[#D4A373]">(ongoing)</span>}
                  </td>
                  <td className="py-1.5">{g.missed_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
