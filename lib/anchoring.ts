import crypto from 'crypto';
import type { LedgerEntry } from './ledger';
import type { ExternalAnchorPublic } from './types';
import type { PersistedAnchor } from './anchorStore';

/**
 * Compute the binding hash that ties internal state to an external reference.
 * Formula: SHA256(internal_hash | external_reference)
 *
 * For dual-source anchors, external_reference = btc_hash|rekor_root_hash.
 * The formula itself does not change — only the input does.
 */
export function computeBinding(internalHash: string, externalReference: string): string {
  const canonical = `${internalHash}|${externalReference}`;
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/** Deterministic simulated external block hash */
function simulatedBlockHash(timestamp: string): string {
  const seed = `ext_block_${timestamp}`;
  return crypto.createHash('sha256').update(seed, 'utf8').digest('hex');
}

/** Deterministic simulated block height */
function simulatedBlockHeight(timestamp: string): number {
  const epoch = new Date('2024-01-01T00:00:00Z').getTime();
  const ts = new Date(timestamp).getTime();
  const daysSinceEpoch = Math.floor((ts - epoch) / (24 * 60 * 60 * 1000));
  return 876_000 + daysSinceEpoch * 144;
}

/**
 * Generate all-simulated anchors from a built chain.
 * Real anchors are injected separately via applyRealAnchor.
 */
export function generateAnchors(
  entries: LedgerEntry[],
  anchorInterval: number = 7,
): ExternalAnchorPublic[] {
  const anchors: ExternalAnchorPublic[] = [];

  for (let i = anchorInterval - 1; i < entries.length; i += anchorInterval) {
    const entry = entries[i];
    const extRef = simulatedBlockHash(entry.observed_at);
    const extHeight = simulatedBlockHeight(entry.observed_at);
    const bindingHash = computeBinding(entry.current_hash, extRef);

    anchors.push({
      chain_index: entry.index,
      anchored_at: entry.observed_at,
      internal_hash: entry.current_hash,
      external_source: 'simulated',
      external_reference: extRef,
      external_height: extHeight,
      binding_hash: bindingHash,
      binding_verified: true,
      external_verifiable: false,
    });
  }

  return anchors;
}

/**
 * Inject a persisted real anchor into the simulated anchor array.
 * Matches on chain_index. Overwrites simulated fields with DB-authoritative values.
 * If real is null, returns anchors unchanged.
 */
export function applyRealAnchor(
  anchors: ExternalAnchorPublic[],
  real: PersistedAnchor | null,
): ExternalAnchorPublic[] {
  if (!real) return anchors;

  return anchors.map((a) => {
    if (a.chain_index !== real.chain_index) return a;

    const result: ExternalAnchorPublic = {
      ...a,
      external_source: real.external_source,
      external_reference: real.external_reference,
      external_height: real.block_height,
      binding_hash: real.binding_hash,
      binding_verified: true,
      external_verifiable: true,
    };

    if (real.rekor_root_hash) {
      result.rekor_root_hash = real.rekor_root_hash;
    }
    if (real.rekor_tree_size != null) {
      result.rekor_tree_size = real.rekor_tree_size;
    }

    return result;
  });
}

/**
 * Verify an existing set of anchors by recomputing each binding hash.
 */
export function verifyAnchors(anchors: ExternalAnchorPublic[]): {
  all_verified: boolean;
  broken_at: number;
} {
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const expected = computeBinding(a.internal_hash, a.external_reference);
    if (a.binding_hash !== expected) {
      return { all_verified: false, broken_at: i };
    }
  }
  return { all_verified: true, broken_at: -1 };
}
