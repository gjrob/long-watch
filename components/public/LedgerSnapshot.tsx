import type { LedgerSnapshot as LedgerData } from '@/lib/types';

interface LedgerSnapshotProps {
  ledger: LedgerData;
}

function truncateHash(hash: string): string {
  return hash.slice(0, 8) + '…' + hash.slice(-4);
}

export default function LedgerSnapshot({ ledger }: LedgerSnapshotProps) {
  return (
    <div>
      <div className="text-sm font-semibold">Ledger Snapshot</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Chain depth</span>
          <span className="text-[#E6EAF2]">{ledger.chain_depth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Head hash</span>
          <span className="font-mono text-xs text-[#E6EAF2]" title={ledger.head_hash}>
            {truncateHash(ledger.head_hash)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Genesis</span>
          <span className="font-mono text-xs text-[#6B7280]" title={ledger.genesis_hash}>
            {ledger.genesis_hash.slice(0, 8)}…
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Merkle root</span>
          <span className="font-mono text-xs text-[#E6EAF2]" title={ledger.merkle_root}>
            {truncateHash(ledger.merkle_root)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Integrity</span>
          <span className="text-[#E6EAF2]">
            {ledger.chain_verified ? 'Verified' : 'Broken'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9AA4B2]">Mutation attempts</span>
          <span className="text-[#E6EAF2]">{ledger.mutation_attempts}</span>
        </div>
      </div>
    </div>
  );
}
