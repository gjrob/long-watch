#!/usr/bin/env node

/**
 * verify-chain.mjs — Independent Chain Replayer
 *
 * Reconstructs the entire chain from API data and verifies every
 * cryptographic commitment independently. Trusts nothing from the server
 * except raw signal values and timestamps.
 *
 * What it verifies:
 *   1. Chain integrity — recompute every hash from genesis
 *   2. Head hash — recomputed head matches API-reported head
 *   3. Merkle root — recomputed root matches API-reported root
 *   4. Anchor bindings — recompute SHA256(internal_hash | external_reference)
 *   5. Anchor chain alignment — anchor's internal_hash matches chain at that index
 *   6. Inclusion proofs — fetch and independently verify each proof
 *
 * Usage:
 *   node scripts/verify-chain.mjs                          # default: localhost:3000
 *   node scripts/verify-chain.mjs https://long-watch.vercel.app
 *
 * Exit code 0 = all checks pass. Exit code 1 = at least one failure.
 */

import { createHash } from 'node:crypto';

const BASE = process.argv[2] || 'http://localhost:3000';

// ── Hash functions (must match server exactly) ──────────────────────

function sha256(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

const GENESIS_HASH = '0'.repeat(64);

function computeChainHash(prevHash, observedAt, signal, temp, env) {
  const canonical = [
    prevHash,
    observedAt,
    signal.toFixed(4),
    temp.toFixed(4),
    env.toFixed(4),
  ].join('|');
  return sha256(canonical);
}

function computeBinding(internalHash, externalReference) {
  return sha256(`${internalHash}|${externalReference}`);
}

function hashLeaf(data) {
  return sha256('leaf:' + data);
}

function hashNode(left, right) {
  return sha256('node:' + left + '|' + right);
}

function buildMerkleRoot(chainHashes) {
  if (chainHashes.length === 0) return sha256('empty_tree');

  let layer = chainHashes.map((h) => hashLeaf(h));
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
      next.push(hashNode(left, right));
    }
    layer = next;
  }
  return layer[0];
}

function verifyInclusionProof(leafHash, steps, expectedRoot) {
  let current = leafHash;
  for (const step of steps) {
    if (step.position === 'left') {
      current = hashNode(step.hash, current);
    } else {
      current = hashNode(current, step.hash);
    }
  }
  return current === expectedRoot;
}

// ── Reporting ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}  —  ${detail || 'FAILED'}`);
    failed++;
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Long Watch Independent Verifier`);
  console.log(`Target: ${BASE}`);
  console.log('');

  // ── Step 1: Fetch dashboard ───────────────────────────────────

  console.log('Fetching /api/dashboard ...');
  const dashRes = await fetch(`${BASE}/api/dashboard`, { cache: 'no-store' });
  if (!dashRes.ok) throw new Error(`dashboard: ${dashRes.status}`);
  const dash = await dashRes.json();

  const timeseries = dash.timeseries;
  const reportedHead = dash.ledger.head_hash;
  const reportedGenesis = dash.ledger.genesis_hash;
  const reportedMerkleRoot = dash.ledger.merkle_root;
  const reportedDepth = dash.ledger.chain_depth;

  console.log(`  Received ${timeseries.length} timeseries points`);
  console.log(`  Reported chain depth: ${reportedDepth}`);
  console.log('');

  // ── Step 2: Rebuild chain from genesis ────────────────────────

  console.log('Rebuilding chain from genesis ...');
  const chainHashes = [];
  let prevHash = GENESIS_HASH;

  for (let i = 0; i < timeseries.length; i++) {
    const p = timeseries[i];
    const hash = computeChainHash(
      prevHash,
      p.observed_at,
      p.signal_value,
      p.temperature_value,
      p.environment_value,
    );
    chainHashes.push(hash);
    prevHash = hash;
  }

  const recomputedHead = prevHash;

  check('Genesis hash', reportedGenesis === GENESIS_HASH, `expected ${GENESIS_HASH.slice(0, 16)}, got ${reportedGenesis.slice(0, 16)}`);
  check('Chain depth', chainHashes.length === reportedDepth, `expected ${reportedDepth}, got ${chainHashes.length}`);
  check('Head hash', recomputedHead === reportedHead, `recomputed ${recomputedHead.slice(0, 16)}..., reported ${reportedHead.slice(0, 16)}...`);
  console.log('');

  // ── Step 3: Rebuild Merkle tree ───────────────────────────────

  console.log('Rebuilding Merkle tree ...');
  const recomputedMerkleRoot = buildMerkleRoot(chainHashes);

  check('Merkle root', recomputedMerkleRoot === reportedMerkleRoot, `recomputed ${recomputedMerkleRoot.slice(0, 16)}..., reported ${reportedMerkleRoot.slice(0, 16)}...`);
  console.log('');

  // ── Step 4: Verify anchors ────────────────────────────────────

  console.log('Fetching /api/anchors ...');
  const anchorsRes = await fetch(`${BASE}/api/anchors`, { cache: 'no-store' });
  if (!anchorsRes.ok) throw new Error(`anchors: ${anchorsRes.status}`);
  const anchorsData = await anchorsRes.json();
  const anchors = anchorsData.anchors || [];

  console.log(`  ${anchors.length} persisted anchor(s)`);

  for (const a of anchors) {
    console.log(`  Anchor ${a.anchor_date} (chain_index ${a.chain_index}):`);

    // Binding recomputation
    const recomputedBinding = computeBinding(a.internal_hash, a.external_reference);
    check(
      'Binding hash',
      recomputedBinding === a.binding_hash,
      `recomputed ${recomputedBinding.slice(0, 16)}..., stored ${a.binding_hash.slice(0, 16)}...`,
    );

    // Chain alignment
    if (a.chain_index < chainHashes.length) {
      check(
        'Chain alignment',
        chainHashes[a.chain_index] === a.internal_hash,
        `chain[${a.chain_index}] = ${chainHashes[a.chain_index]?.slice(0, 16)}..., anchor = ${a.internal_hash.slice(0, 16)}...`,
      );
    } else {
      check('Chain alignment', false, `chain_index ${a.chain_index} out of bounds (depth ${chainHashes.length})`);
    }

    // Dual-source decomposition
    if (a.external_source === 'bitcoin+rekor') {
      const parts = a.external_reference.split('|');
      check('Dual-source format', parts.length === 2, `expected 2 parts, got ${parts.length}`);
      if (parts.length === 2) {
        console.log(`    btc:   ${parts[0].slice(0, 20)}...`);
        console.log(`    rekor: ${parts[1].slice(0, 20)}...`);
      }
    }
  }
  console.log('');

  // ── Step 5: Verify inclusion proofs ───────────────────────────

  console.log('Verifying inclusion proofs ...');

  // Test a sample of indices: first, last, each anchor index, and a mid-point
  const indicesToTest = new Set([0, chainHashes.length - 1, Math.floor(chainHashes.length / 2)]);
  for (const a of anchors) {
    indicesToTest.add(a.chain_index);
  }

  for (const idx of [...indicesToTest].sort((a, b) => a - b)) {
    if (idx >= chainHashes.length) continue;

    const proofRes = await fetch(`${BASE}/api/verify/inclusion?index=${idx}`, { cache: 'no-store' });
    if (!proofRes.ok) {
      check(`Inclusion #${idx}`, false, `fetch failed: ${proofRes.status}`);
      continue;
    }

    const proofData = await proofRes.json();
    if (!proofData.ok) {
      check(`Inclusion #${idx}`, false, proofData.error);
      continue;
    }

    // Recompute leaf hash
    const leafHash = hashLeaf(proofData.proof.leaf_data);
    check(
      `Inclusion #${idx} leaf`,
      leafHash === proofData.proof.leaf_hash,
      'leaf hash mismatch',
    );

    // Recompute root from proof
    const rootMatch = verifyInclusionProof(leafHash, proofData.proof.steps, proofData.proof.merkle_root);
    check(
      `Inclusion #${idx} root`,
      rootMatch,
      'recomputed root does not match proof root',
    );

    // Verify proof root matches our independently computed Merkle root
    check(
      `Inclusion #${idx} consistency`,
      proofData.proof.merkle_root === recomputedMerkleRoot,
      `proof root ${proofData.proof.merkle_root.slice(0, 16)}... != our root ${recomputedMerkleRoot.slice(0, 16)}...`,
    );
  }
  console.log('');

  // ── Summary ───────────────────────────────────────────────────

  console.log('════════════════════════════════════════');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log('════════════════════════════════════════');

  if (failed > 0) {
    console.log('');
    console.log('VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('');
    console.log('ALL CHECKS PASSED');
    console.log('Chain is self-consistent, Merkle tree is valid,');
    console.log('anchor bindings are correct, inclusion proofs verify.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
