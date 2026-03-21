import crypto from 'crypto';

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Domain-separated leaf hash. Prevents second-preimage attacks. */
function hashLeaf(data: string): string {
  return sha256('leaf:' + data);
}

/** Domain-separated internal node hash. */
function hashNode(left: string, right: string): string {
  return sha256('node:' + left + '|' + right);
}

export interface MerkleProofStep {
  hash: string;
  position: 'left' | 'right';
}

export interface MerkleProof {
  leaf_index: number;
  leaf_hash: string;
  leaf_data: string;
  proof: MerkleProofStep[];
  root: string;
  tree_size: number;
}

export interface MerkleTree {
  root: string;
  leaf_count: number;
  depth: number;
}

/**
 * Build the full layer structure from leaf data.
 * If the number of leaves is odd at any level, the last node is duplicated.
 */
function buildLayers(leafData: string[]): { layers: string[][]; root: string } {
  if (leafData.length === 0) {
    const empty = sha256('empty_tree');
    return { layers: [[empty]], root: empty };
  }

  let layer = leafData.map((d) => hashLeaf(d));
  const layers: string[][] = [layer];

  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
      next.push(hashNode(left, right));
    }
    layer = next;
    layers.push(layer);
  }

  return { layers, root: layer[0] };
}

/**
 * Build a Merkle tree from chain entry hashes.
 * Returns only the root and metadata (not the full layer structure).
 */
export function buildMerkleTree(chainHashes: string[]): MerkleTree {
  const { layers, root } = buildLayers(chainHashes);
  return {
    root,
    leaf_count: chainHashes.length,
    depth: layers.length - 1,
  };
}

/**
 * Generate an inclusion proof for a specific leaf index.
 *
 * The proof is a list of sibling hashes from the leaf level up to the root.
 * A verifier can recompute the root using only the leaf data and this proof.
 *
 * Returns null if the index is out of bounds.
 */
export function generateInclusionProof(
  chainHashes: string[],
  index: number,
): MerkleProof | null {
  if (index < 0 || index >= chainHashes.length) return null;

  const { layers, root } = buildLayers(chainHashes);
  const proof: MerkleProofStep[] = [];

  let idx = index;
  for (let level = 0; level < layers.length - 1; level++) {
    const layer = layers[level];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;

    if (siblingIdx < layer.length) {
      proof.push({
        hash: layer[siblingIdx],
        position: isRight ? 'left' : 'right',
      });
    } else {
      // Odd-count duplication: node is paired with itself
      proof.push({
        hash: layer[idx],
        position: isRight ? 'left' : 'right',
      });
    }

    idx = Math.floor(idx / 2);
  }

  return {
    leaf_index: index,
    leaf_hash: hashLeaf(chainHashes[index]),
    leaf_data: chainHashes[index],
    proof,
    root,
    tree_size: chainHashes.length,
  };
}

/**
 * Verify an inclusion proof by recomputing the root from the leaf hash
 * and the proof path. Returns true if the recomputed root matches.
 */
export function verifyInclusionProof(proof: MerkleProof): boolean {
  let current = proof.leaf_hash;

  for (const step of proof.proof) {
    if (step.position === 'left') {
      current = hashNode(step.hash, current);
    } else {
      current = hashNode(current, step.hash);
    }
  }

  return current === proof.root;
}
