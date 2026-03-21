-- Add Rekor transparency log fields for dual-source anchoring.
-- Nullable for backward compatibility with existing single-source rows.

alter table external_anchors
  add column rekor_root_hash text,
  add column rekor_tree_size bigint;
