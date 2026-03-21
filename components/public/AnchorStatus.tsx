import type { Anchoring } from '@/lib/types';

interface AnchorStatusProps {
  anchoring: Anchoring;
}

function truncate(hash: string, len: number = 8): string {
  if (hash.length <= len) return hash;
  return hash.slice(0, len) + '…';
}

export default function AnchorStatus({ anchoring }: AnchorStatusProps) {
  const realAnchor = anchoring.anchors.find((a) => a.external_verifiable);
  const isDual = realAnchor?.external_source === 'bitcoin+rekor';

  return (
    <div className="rounded-md bg-[#1A2030] p-4">
      <div className="text-xs text-[#9AA4B2]">
        External: {isDual ? 'Bitcoin + Rekor (daily)' : 'Bitcoin (daily)'}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-sm font-semibold text-[#E6EAF2]">
          Today: {anchoring.real_anchor_present ? 'anchored' : 'not anchored'}
        </span>
      </div>

      {realAnchor && (
        <div className="mt-2 space-y-0.5 text-xs text-[#9AA4B2]">
          <div>
            Bitcoin block{' '}
            <span className="text-[#E6EAF2]">{realAnchor.external_height.toLocaleString()}</span>
          </div>
          {realAnchor.rekor_tree_size != null && (
            <div>
              Rekor tree size{' '}
              <span className="text-[#E6EAF2]">{realAnchor.rekor_tree_size.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-1.5 text-xs text-[#6B7280]">
        {anchoring.anchor_count} total · {anchoring.verified ? 'all verified' : 'verification incomplete'}
        {anchoring.anchoring_start_date && (
          <span> · anchoring since {anchoring.anchoring_start_date}</span>
        )}
      </div>
    </div>
  );
}
