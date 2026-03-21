import { supabaseAnonServer } from './supabase/server';

export interface PersistedAnchor {
  id: number;
  created_at: string;
  anchor_date: string;
  chain_index: number;
  chain_depth: number;
  internal_hash: string;
  binding_hash: string;
  external_source: string;
  external_reference: string;
  block_hash: string;
  block_height: number;
  observed_at: string;
  external_verifiable: boolean;
  rekor_root_hash: string | null;
  rekor_tree_size: number | null;
}

export async function getAnchorByDate(anchorDate: string): Promise<PersistedAnchor | null> {
  const supabase = supabaseAnonServer();

  const { data, error } = await supabase
    .from('external_anchors')
    .select('*')
    .eq('anchor_date', anchorDate)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function insertAnchor(row: Omit<PersistedAnchor, 'id' | 'created_at'>): Promise<void> {
  const supabase = supabaseAnonServer();

  // Try with Rekor columns first; fall back without if columns don't exist yet
  const { error } = await supabase
    .from('external_anchors')
    .insert(row);

  if (error) {
    // Unique violation on anchor_date → another request already wrote it; benign
    if ((error as unknown as { code: string }).code === '23505') return;

    // If Rekor columns don't exist yet, retry without them
    if (error.message?.includes('rekor_')) {
      const { rekor_root_hash: _r, rekor_tree_size: _t, ...withoutRekor } = row;
      const { error: retryErr } = await supabase
        .from('external_anchors')
        .insert(withoutRekor);

      if (retryErr) {
        if ((retryErr as unknown as { code: string }).code === '23505') return;
        throw retryErr;
      }
      return;
    }

    throw error;
  }
}

/** Returns all persisted anchors ordered by anchor_date ascending. */
export async function getAllAnchors(): Promise<PersistedAnchor[]> {
  const supabase = supabaseAnonServer();

  const { data, error } = await supabase
    .from('external_anchors')
    .select('*')
    .order('anchor_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Returns the earliest anchor_date, or null if no anchors exist. */
export async function getAnchoringStartDate(): Promise<string | null> {
  const supabase = supabaseAnonServer();

  const { data, error } = await supabase
    .from('external_anchors')
    .select('anchor_date')
    .order('anchor_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.anchor_date ?? null;
}
