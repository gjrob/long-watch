#!/usr/bin/env node

/**
 * mirror-anchors.mjs
 *
 * Fetches all persisted anchors from /api/anchors and writes them
 * to public/anchors.json. This file can be:
 *
 *   - Committed to Git (immutable public record)
 *   - Pinned to IPFS (content-addressed archive)
 *   - Hosted on any static server (independent mirror)
 *
 * Usage:
 *   node scripts/mirror-anchors.mjs                          # default: localhost:3000
 *   node scripts/mirror-anchors.mjs https://long-watch.vercel.app
 *
 * The output file includes a snapshot timestamp and the raw anchor data.
 * Each run appends are reflected as a new commit — the file itself is
 * overwritten, but Git preserves every prior version.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = join(__dirname, '..', 'public', 'anchors.json');

async function main() {
  console.log(`Fetching anchors from ${BASE}/api/anchors ...`);

  const res = await fetch(`${BASE}/api/anchors`, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();

  if (!data.ok) {
    console.error('API returned error:', data.error);
    process.exit(1);
  }

  const snapshot = {
    mirrored_at: new Date().toISOString(),
    source: BASE,
    anchor_count: data.count,
    anchors: data.anchors,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${data.count} anchor(s) to ${OUT}`);
  console.log('');
  for (const a of data.anchors) {
    console.log(`  ${a.anchor_date}  block ${a.block_height}  ${a.external_source}  ${a.binding_hash.slice(0, 16)}...`);
  }
  console.log('');
  console.log('To commit:  git add public/anchors.json && git commit -m "anchor snapshot"');
  console.log('To pin:     ipfs add public/anchors.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
