import type { LedgerSnapshot, SeriesSummary } from '@/lib/types';

interface MicroStatsProps {
  ledger: LedgerSnapshot;
  series: SeriesSummary[];
}

/**
 * Counts only. "Signals: 4" was previously a literal typed into page.tsx and
 * "Edits: 0" was a hardcoded `mutation_attempts: 0` — neither was ever read
 * from the database, so both are gone. Append-only is asserted by the grant
 * layer and the hash chain, not by a counter the page makes up.
 */
export default function MicroStats({ ledger, series }: MicroStatsProps) {
  return (
    <div className="text-xs text-[#9AA4B2]">
      Series: <span className="text-[#E6EAF2]">{ledger.series_count}</span> · Observations:{' '}
      <span className="text-[#E6EAF2]">{ledger.row_count.toLocaleString()}</span>
      {series.map((s) => (
        <span key={s.series_key}>
          {' · '}
          <span className="font-mono text-[#6B7280]">{s.series_key}</span>{' '}
          <span className="text-[#E6EAF2]">{s.count}</span>
        </span>
      ))}
    </div>
  );
}
