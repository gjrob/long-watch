export interface ExternalRef {
  source: 'bitcoin';
  block_hash: string;
  block_height: number;
  observed_at: string;
}

export interface RekorRef {
  source: 'rekor';
  root_hash: string;
  tree_size: number;
  observed_at: string;
}

/**
 * Fetch the current Bitcoin chain tip from Blockstream's public API.
 * No API key required. Two small GETs.
 */
export async function fetchBitcoinTip(): Promise<ExternalRef> {
  const base = 'https://blockstream.info/api';

  const [hRes, hashRes] = await Promise.all([
    fetch(`${base}/blocks/tip/height`, { cache: 'no-store' }),
    fetch(`${base}/blocks/tip/hash`, { cache: 'no-store' }),
  ]);

  if (!hRes.ok) throw new Error(`tip height: ${hRes.status}`);
  if (!hashRes.ok) throw new Error(`tip hash: ${hashRes.status}`);

  const height = Number(await hRes.text());
  const block_hash = (await hashRes.text()).trim();

  return {
    source: 'bitcoin',
    block_hash,
    block_height: height,
    observed_at: new Date().toISOString(),
  };
}

/**
 * Fetch the current Rekor transparency log tree head from Sigstore.
 * Public API. No API key required. Single GET.
 */
export async function fetchRekorTreeHead(): Promise<RekorRef> {
  const res = await fetch('https://rekor.sigstore.dev/api/v1/log', {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`rekor log: ${res.status}`);

  const data = await res.json();

  return {
    source: 'rekor',
    root_hash: String(data.rootHash),
    tree_size: Number(data.treeSize),
    observed_at: new Date().toISOString(),
  };
}
