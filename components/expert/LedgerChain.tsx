import type { LedgerEntryPublic } from '@/lib/types';
import { utcStamp } from '@/lib/format';

/**
 * The real tail of the hash chain, straight from `signals`. Each row's
 * prev_hash should equal the row_hash of the previous row in the same series —
 * that linkage is what the 86 existing rows already satisfy.
 */
export default function LedgerChain({ tail }: { tail: LedgerEntryPublic[] }) {
  if (tail.length === 0) {
    return <div className="text-sm text-[#9AA4B2]">No rows recorded.</div>;
  }

  return (
    <div>
      <table className="w-full text-left text-xs">
        <thead className="text-[#6B7280]">
          <tr>
            <th className="pb-2 font-normal">Observed</th>
            <th className="pb-2 font-normal">Series</th>
            <th className="pb-2 font-normal">prev_hash</th>
            <th className="pb-2 font-normal">row_hash</th>
          </tr>
        </thead>
        <tbody className="text-[#E6EAF2]">
          {tail.map((e) => (
            <tr key={e.row_hash} className="border-t border-[#2A3242]">
              <td className="py-2 font-mono">{utcStamp(e.observed_at)}</td>
              <td className="py-2 font-mono text-[#9AA4B2]">{e.series_key}</td>
              <td className="py-2 font-mono text-[#6B7280]" title={e.prev_hash ?? ''}>
                {e.prev_hash ? e.prev_hash.slice(0, 10) + '…' : '—'}
              </td>
              <td className="py-2 font-mono" title={e.row_hash}>
                {e.row_hash.slice(0, 10) + '…'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-xs text-[#6B7280]">
        Independent verification: <span className="font-mono">/api/verify/series</span> ·{' '}
        <span className="font-mono">/api/verify/head</span>
      </div>
    </div>
  );
}
