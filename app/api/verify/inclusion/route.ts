import { buildChain } from '@/lib/ledger';
import { generateInclusionProof, verifyInclusionProof } from '@/lib/merkle';
import { generateTimeseries } from '@/lib/timeseries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public inclusion proof endpoint.
 *
 * GET /api/verify/inclusion?index=N
 *
 * Returns a Merkle inclusion proof for chain entry at index N.
 * The proof enables a third party to verify that a specific entry
 * exists within the full chain by recomputing the Merkle root
 * from just the entry hash and the proof path.
 *
 * No authentication required. Read-only. Deterministic.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const indexParam = url.searchParams.get('index');

  if (indexParam == null) {
    return Response.json(
      { ok: false, error: 'missing_parameter', detail: 'index is required' },
      { status: 400 },
    );
  }

  const index = Number(indexParam);
  if (!Number.isInteger(index) || index < 0) {
    return Response.json(
      { ok: false, error: 'invalid_parameter', detail: 'index must be a non-negative integer' },
      { status: 400 },
    );
  }

  // Rebuild chain (deterministic — identical output as dashboard within the same UTC day)
  const timeseries = generateTimeseries(30);
  const chain = buildChain(timeseries);

  if (index >= chain.entries.length) {
    return Response.json(
      {
        ok: false,
        error: 'index_out_of_bounds',
        detail: `index ${index} exceeds chain depth ${chain.entries.length}`,
        chain_depth: chain.entries.length,
      },
      { status: 400 },
    );
  }

  const chainHashes = chain.entries.map((e) => e.current_hash);
  const proof = generateInclusionProof(chainHashes, index);

  if (!proof) {
    return Response.json(
      { ok: false, error: 'proof_generation_failed' },
      { status: 500 },
    );
  }

  const verified = verifyInclusionProof(proof);
  const entry = chain.entries[index];

  return Response.json({
    ok: true,
    entry: {
      index: entry.index,
      observed_at: entry.observed_at,
      current_hash: entry.current_hash,
      prev_hash: entry.prev_hash,
    },
    proof: {
      leaf_index: proof.leaf_index,
      leaf_hash: proof.leaf_hash,
      leaf_data: proof.leaf_data,
      steps: proof.proof,
      merkle_root: proof.root,
      tree_size: proof.tree_size,
    },
    verified,
    verification_method: 'Recompute root from leaf_hash using proof steps. leaf_hash = SHA256("leaf:" + leaf_data). node_hash = SHA256("node:" + left + "|" + right).',
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
