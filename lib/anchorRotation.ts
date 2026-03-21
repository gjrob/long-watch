import { getAnchorByDate, insertAnchor, type PersistedAnchor } from './anchorStore';
import { fetchBitcoinTip, fetchRekorTreeHead } from './external';
import { computeBinding } from './anchoring';

function utcDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface ChainEntry {
  index: number;
  current_hash: string;
  observed_at: string;
}

/**
 * Build the composite external reference for dual-source binding.
 * Format: btc_hash|rekor_root_hash
 *
 * If only Bitcoin is available (Rekor failed), falls back to btc_hash alone.
 * The binding formula itself doesn't change:
 *   binding_hash = SHA256(internal_hash | external_reference)
 *
 * Compromise of a dual-source anchor requires controlling both
 * the Bitcoin blockchain AND the Sigstore transparency log.
 */
function compositeReference(btcHash: string, rekorHash: string | null): string {
  if (rekorHash) return `${btcHash}|${rekorHash}`;
  return btcHash;
}

/**
 * Get or create exactly one real anchor for today's UTC date.
 *
 * Dual-source: fetches both Bitcoin tip and Rekor tree head.
 * If Rekor fails, proceeds with Bitcoin only (single-source).
 * If Bitcoin fails, returns null (no anchor created).
 *
 * No retries. No loops.
 */
export async function getOrCreateDailyAnchor(
  entries: ChainEntry[],
  interval: number,
): Promise<PersistedAnchor | null> {
  const today = utcDateISO(new Date());

  // 1) Reuse if exists
  const existing = await getAnchorByDate(today);
  if (existing) return existing;

  // 2) Select last eligible anchor index
  let anchorIndex = -1;
  for (let i = interval - 1; i < entries.length; i += interval) {
    anchorIndex = i;
  }
  if (anchorIndex < 0) return null;

  const entry = entries[anchorIndex];

  // 3) Fetch external references (Bitcoin required, Rekor best-effort)
  const btcRef = await fetchBitcoinTip();

  let rekorRef: { root_hash: string; tree_size: number; observed_at: string } | null = null;
  try {
    rekorRef = await fetchRekorTreeHead();
  } catch {
    // Rekor unavailable — proceed with Bitcoin only
    rekorRef = null;
  }

  // 4) Compute composite reference and binding
  const extReference = compositeReference(btcRef.block_hash, rekorRef?.root_hash ?? null);
  const bindingHash = computeBinding(entry.current_hash, extReference);

  const row = {
    anchor_date: today,
    chain_index: anchorIndex,
    chain_depth: anchorIndex + 1,
    internal_hash: entry.current_hash,
    binding_hash: bindingHash,
    external_source: rekorRef ? 'bitcoin+rekor' : 'bitcoin',
    external_reference: extReference,
    block_hash: btcRef.block_hash,
    block_height: btcRef.block_height,
    observed_at: btcRef.observed_at,
    external_verifiable: true,
    rekor_root_hash: rekorRef?.root_hash ?? null,
    rekor_tree_size: rekorRef?.tree_size ?? null,
  };

  // 5) Persist (append-only; unique constraint swallows duplicates)
  await insertAnchor(row);

  return row as unknown as PersistedAnchor;
}
