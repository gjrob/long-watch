import type { LedgerSnapshot as LedgerData } from '@/lib/types';

function truncate(h: string | null): string {
  if (!h) return '—';
  return h.slice(0, 8) + '…' + h.slice(-4);
}

/**
 * Real chain endpoints from the database. The merkle root and the "mutation
 * attempts: 0" row are gone: the root was computed over a generated chain, and
 * nothing counts mutation attempts.
 */
export default function LedgerSnapshot({ ledger }: { ledger: LedgerData }) {
  return (
    <div>
      <div className="text-sm font-semibold">Ledger Snapshot</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Rows</span>
          <span className="text-[#E6EAF2]">{ledger.row_count.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Series</span>
          <span className="text-[#E6EAF2]">{ledger.series_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Head hash</span>
          <span className="font-mono text-xs text-[#E6EAF2]" title={ledger.head_hash ?? ''}>
            {truncate(ledger.head_hash)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Genesis</span>
          <span className="font-mono text-xs text-[#6B7280]" title={ledger.genesis_hash ?? ''}>
            {truncate(ledger.genesis_hash)}
          </span>
        </div>
      </div>
      <div className="mt-3 text-xs text-[#6B7280]">
        Chain verification: <span className="font-mono">/api/verify/head</span>
      </div>
    </div>
  );
}
