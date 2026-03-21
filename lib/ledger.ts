import crypto from 'crypto';
import type { TimeseriesPoint } from './types';

/** 64 zero bytes — the anchor for the first record in every chain */
export const GENESIS_HASH = '0'.repeat(64);

export interface LedgerEntry {
  index: number;
  observed_at: string;
  signal_value: number;
  temperature_value: number;
  environment_value: number;
  prev_hash: string;
  current_hash: string;
}

export interface ChainResult {
  entries: LedgerEntry[];
  head_hash: string;
  genesis_hash: string;
  depth: number;
  verified: boolean;
}

/**
 * Canonical hash input for a single ledger row.
 *
 * Formula: SHA256(prev_hash | observed_at | signal_value | temperature_value | environment_value)
 *
 * All numeric values are formatted to exactly 4 decimal places to guarantee
 * the same input string regardless of floating-point display quirks.
 */
function computeHash(
  prevHash: string,
  observedAt: string,
  signalValue: number,
  temperatureValue: number,
  environmentValue: number,
): string {
  const canonical = [
    prevHash,
    observedAt,
    signalValue.toFixed(4),
    temperatureValue.toFixed(4),
    environmentValue.toFixed(4),
  ].join('|');

  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Build a hash-chained ledger from an ordered timeseries.
 * The timeseries MUST be sorted ascending by observed_at (oldest first).
 */
export function buildChain(timeseries: TimeseriesPoint[]): ChainResult {
  const entries: LedgerEntry[] = [];
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < timeseries.length; i++) {
    const p = timeseries[i];
    const currentHash = computeHash(
      prevHash,
      p.observed_at,
      p.signal_value,
      p.temperature_value,
      p.environment_value,
    );

    entries.push({
      index: i,
      observed_at: p.observed_at,
      signal_value: p.signal_value,
      temperature_value: p.temperature_value,
      environment_value: p.environment_value,
      prev_hash: prevHash,
      current_hash: currentHash,
    });

    prevHash = currentHash;
  }

  return {
    entries,
    head_hash: prevHash,
    genesis_hash: GENESIS_HASH,
    depth: entries.length,
    verified: true, // just built — by definition consistent
  };
}

/**
 * Verify an existing chain by recomputing every hash from genesis.
 * Returns the index of the first broken link, or -1 if the chain is intact.
 */
export function verifyChain(entries: LedgerEntry[]): { verified: boolean; brokenAt: number } {
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];

    // prev_hash pointer must match what we expect
    if (e.prev_hash !== prevHash) {
      return { verified: false, brokenAt: i };
    }

    // Recompute and compare current_hash
    const expected = computeHash(
      prevHash,
      e.observed_at,
      e.signal_value,
      e.temperature_value,
      e.environment_value,
    );

    if (e.current_hash !== expected) {
      return { verified: false, brokenAt: i };
    }

    prevHash = e.current_hash;
  }

  return { verified: true, brokenAt: -1 };
}
