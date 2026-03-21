import type { LedgerEntryPublic, LedgerSnapshot } from '@/lib/types';

interface LedgerChainProps {
  ledger: LedgerSnapshot;
  tail: LedgerEntryPublic[];
}

function truncate(hash: string, len: number = 10): string {
  if (hash.length <= len) return hash;
  return hash.slice(0, len) + '…';
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

export default function LedgerChain({ ledger, tail }: LedgerChainProps) {
  return (
    <div>
      {/* Chain summary */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div className="text-[#9AA4B2]">Chain depth</div>
        <div className="font-mono text-[#E6EAF2]">{ledger.chain_depth}</div>

        <div className="text-[#9AA4B2]">Head hash</div>
        <div className="font-mono text-[#E6EAF2]" title={ledger.head_hash}>
          {truncate(ledger.head_hash, 16)}
        </div>

        <div className="text-[#9AA4B2]">Genesis hash</div>
        <div className="font-mono text-[#6B7280]" title={ledger.genesis_hash}>
          {truncate(ledger.genesis_hash, 16)}
        </div>

        <div className="text-[#9AA4B2]">Merkle root</div>
        <div className="font-mono text-[#E6EAF2]" title={ledger.merkle_root}>
          {truncate(ledger.merkle_root, 16)}
        </div>

        <div className="text-[#9AA4B2]">Verified</div>
        <div className="text-[#E6EAF2]">{ledger.chain_verified ? 'Yes' : 'No'}</div>
      </div>

      {/* Chain tail visualization */}
      <div className="mt-5 text-xs text-[#9AA4B2]">Recent chain entries (newest first)</div>
      <div className="mt-2 space-y-0">
        {tail.map((entry, i) => (
          <div key={entry.index} className="relative">
            {/* Connector line */}
            {i < tail.length - 1 && (
              <div className="absolute left-[7px] top-[20px] h-[calc(100%-8px)] w-px bg-[#2A3242]" />
            )}

            <div className="flex items-start gap-3 py-1.5">
              {/* Chain dot */}
              <div className="mt-1 h-[14px] w-[14px] shrink-0 rounded-full border border-[#2A3242] bg-[#141922] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4A5568]" />
              </div>

              {/* Entry content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-[#9AA4B2]">#{entry.index}</span>
                  <span className="text-xs text-[#6B7280]">{formatDate(entry.observed_at)}</span>
                </div>
                <div className="mt-0.5 font-mono text-xs text-[#E6EAF2]" title={entry.current_hash}>
                  {truncate(entry.current_hash, 24)}
                </div>
                <div className="font-mono text-xs text-[#4A5568]" title={entry.prev_hash}>
                  ← {truncate(entry.prev_hash, 16)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hash formula disclosure */}
      <div className="mt-4 rounded-md bg-[#1A2030] px-3 py-2 text-xs leading-relaxed text-[#6B7280]">
        Chain: SHA-256(prev_hash | observed_at | signal | temperature | environment)
        <br />
        Merkle leaf: SHA-256(&quot;leaf:&quot; + entry_hash) · node: SHA-256(&quot;node:&quot; + left + &quot;|&quot; + right)
        <br />
        Inclusion proof: /api/verify/inclusion?index=N
      </div>
    </div>
  );
}
