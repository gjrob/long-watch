#!/usr/bin/env node

/**
 * generate-thread.mjs
 *
 * Generates a multi-tweet thread via the /api/marketing endpoint,
 * structures it using threadBuilder, and saves to drafts.json.
 *
 * Usage:
 *   node scripts/generate-thread.mjs "nuclear accountability"
 *   node scripts/generate-thread.mjs "time verification" http://localhost:3099
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_PATH = path.resolve(__dirname, '../marketing/ai/drafts.json');

const theme = process.argv[2] || 'time accountability';
const BASE = process.argv[3] || 'http://localhost:3000';
const API_URL = `${BASE}/api/marketing`;

const THREAD_ANGLES = [
  { focus: 'nuclear risk', framing: 'problem' },
  { focus: 'append-only verification', framing: 'solution' },
  { focus: 'public accountability', framing: 'call to action' },
];

async function generateTweet(angle) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, context: angle }),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.tweet;
}

function buildThread(tweets) {
  return tweets.map((text, i) => ({
    id: i + 1,
    content: text,
  }));
}

function saveThread(thread) {
  let drafts = [];
  if (fs.existsSync(DRAFTS_PATH)) {
    try {
      drafts = JSON.parse(fs.readFileSync(DRAFTS_PATH, 'utf-8'));
    } catch {
      drafts = [];
    }
  }

  drafts.push({
    id: drafts.length + 1,
    theme,
    content: thread,
    tweet_count: thread.length,
    created_at: new Date().toISOString(),
  });

  fs.writeFileSync(DRAFTS_PATH, JSON.stringify(drafts, null, 2) + '\n', 'utf-8');
}

async function main() {
  console.log(`Theme: "${theme}"`);
  console.log(`API:   ${API_URL}`);
  console.log('');

  const tweets = [];
  for (const angle of THREAD_ANGLES) {
    const tweet = await generateTweet(angle);
    tweets.push(tweet);
  }

  const thread = buildThread(tweets);

  for (const t of thread) {
    console.log(`  [${t.id}] ${t.content}`);
  }
  console.log('');

  saveThread(thread);
  console.log(`Saved to ${DRAFTS_PATH} (${thread.length} tweets)`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
