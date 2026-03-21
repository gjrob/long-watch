import type { Anchoring, ExternalAnchorPublic } from '@/lib/types';

interface AnchorDetailProps {
  anchoring: Anchoring;
}

function truncate(hash: string, len: number = 12): string {
  if (hash.length <= len) return hash;
  return hash.slice(0, len) + '…';
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AnchorMarker({ isReal }: { isReal: boolean }) {
  if (isReal) {
    return (
      <div className="mt-1 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-sm border border-[#E6EAF2] bg-[#141922]">
        <div className="h-1.5 w-1.5 rounded-full bg-[#E6EAF2]" />
      </div>
    );
  }
  return (
    <div className="mt-1 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-sm border border-[#D4A373] bg-[#141922]">
      <div className="h-1 w-1 rounded-full bg-[#D4A373]" />
    </div>
  );
}

function AnchorEntry({ anchor }: { anchor: ExternalAnchorPublic }) {
  const isReal = anchor.external_verifiable;
  const isDual = anchor.external_source === 'bitcoin+rekor';

  return (
    <div className="flex items-start gap-3 py-2">
      <AnchorMarker isReal={isReal} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-[#9AA4B2]">
            #{anchor.chain_index} · {formatShortDate(anchor.anchored_at)}
            {isReal && (
              <span className="ml-1.5 text-[#E6EAF2]">
                {isDual ? 'dual-source' : 'externally verifiable'}
              </span>
            )}
          </span>
          <span className="text-xs text-[#6B7280]">
            {anchor.external_source} · block {anchor.external_height.toLocaleString()}
          </span>
        </div>

        <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
          <span className="text-[#6B7280]">internal</span>
          <span className="font-mono text-[#9AA4B2]" title={anchor.internal_hash}>
            {truncate(anchor.internal_hash, 16)}
          </span>

          <span className="text-[#6B7280]">{isDual ? 'btc' : 'external'}</span>
          <span className="font-mono text-[#9AA4B2]" title={anchor.external_reference}>
            {isDual
              ? truncate(anchor.external_reference.split('|')[0], 16)
              : truncate(anchor.external_reference, 16)}
          </span>

          {isDual && anchor.rekor_root_hash && (
            <>
              <span className="text-[#6B7280]">rekor</span>
              <span className="font-mono text-[#9AA4B2]" title={anchor.rekor_root_hash}>
                {truncate(anchor.rekor_root_hash, 16)}
                {anchor.rekor_tree_size != null && (
                  <span className="ml-1.5 text-[#6B7280]">
                    tree {anchor.rekor_tree_size.toLocaleString()}
                  </span>
                )}
              </span>
            </>
          )}

          <span className="text-[#6B7280]">binding</span>
          <span className="font-mono text-[#E6EAF2]" title={anchor.binding_hash}>
            {truncate(anchor.binding_hash, 16)}
            {anchor.binding_verified && (
              <span className="ml-1.5 text-[#6B7280]">verified</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnchorDetail({ anchoring }: AnchorDetailProps) {
  const realCount = anchoring.anchors.filter((a) => a.external_verifiable).length;
  const simCount = anchoring.anchors.length - realCount;
  const hasDual = anchoring.anchors.some((a) => a.external_source === 'bitcoin+rekor');

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div className="text-[#9AA4B2]">Anchor count</div>
        <div className="text-[#E6EAF2]">{anchoring.anchor_count}</div>

        <div className="text-[#9AA4B2]">Anchor interval</div>
        <div className="text-[#E6EAF2]">Every {anchoring.anchor_interval} entries</div>

        <div className="text-[#9AA4B2]">Real / Simulated</div>
        <div className="text-[#E6EAF2]">{realCount} / {simCount}</div>

        <div className="text-[#9AA4B2]">Today anchored</div>
        <div className="text-[#E6EAF2]">{anchoring.real_anchor_present ? 'Yes' : 'No'}</div>

        <div className="text-[#9AA4B2]">Sources</div>
        <div className="text-[#E6EAF2]">{hasDual ? 'Bitcoin + Rekor' : 'Bitcoin'}</div>

        <div className="text-[#9AA4B2]">Anchoring since</div>
        <div className="text-[#E6EAF2]">{anchoring.anchoring_start_date ?? 'not yet'}</div>

        <div className="text-[#9AA4B2]">All verified</div>
        <div className="text-[#E6EAF2]">{anchoring.verified ? 'Yes' : 'No'}</div>
      </div>

      {/* Backfill notice */}
      {anchoring.anchoring_start_date && (
        <div className="mt-3 text-xs text-[#6B7280]">
          No external anchors exist before {anchoring.anchoring_start_date}.
          Pre-anchoring chain state is self-consistent but not externally time-constrained.
        </div>
      )}

      {/* Anchor log */}
      <div className="mt-5 text-xs text-[#9AA4B2]">Anchor points</div>
      <div className="mt-2 space-y-0">
        {anchoring.anchors.map((a, i) => (
          <div key={i} className="relative">
            {i < anchoring.anchors.length - 1 && (
              <div className="absolute left-[7px] top-[22px] h-[calc(100%-10px)] w-px bg-[#2A3242]" />
            )}
            <AnchorEntry anchor={a} />
          </div>
        ))}
      </div>

      {/* Formula disclosure */}
      <div className="mt-4 rounded-md bg-[#1A2030] px-3 py-2 text-xs leading-relaxed text-[#6B7280]">
        Binding: SHA-256(internal_hash | external_reference)
        <br />
        {hasDual
          ? 'Dual-source: external_reference = btc_block_hash | rekor_root_hash'
          : 'Single-source: external_reference = btc_block_hash'}
        <br />
        Public verification: /api/anchors
      </div>
    </div>
  );
}
