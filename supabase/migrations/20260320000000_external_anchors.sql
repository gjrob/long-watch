create table external_anchors (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),

  anchor_date date not null,
  chain_index int not null,
  chain_depth int not null,

  internal_hash text not null,
  binding_hash text not null,

  external_source text not null,
  external_reference text not null,

  block_hash text not null,
  block_height int not null,
  observed_at timestamptz not null,

  external_verifiable boolean not null,
  unique(anchor_date)
);
