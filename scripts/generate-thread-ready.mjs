#!/usr/bin/env node

/**
 * generate-thread-ready.mjs
 *
 * Generates a Twitter-ready thread with Problem → Solution → CTA framing,
 * auto-numbering, and saves to drafts.json.
 *
 * Usage:
 *   node scripts/generate-thread-ready.mjs "nuclear accountability"
 *   node scripts/generate-thread-ready.mjs "time verification" http://localhost:3099
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_PATH = path.resolve(__dirname, '../marketing/ai/drafts.json');

const theme = process.argv[2] || 'nuclear accountability';
const BASE = process.argv[3] || 'http://localhost:3000';
const API_URL = `${BASE}/api/marketing`;

const FRAMES = ['Problem', 'Solution', 'CTA'];

async function generateTweet(frame, context) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, context, frame }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.tweet;
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
    format: 'twitter-thread',
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

  const context = { city: 'Wilmington', focus: 'nuclear risk' };
  const total = FRAMES.length;
  const thread = [];

  for (let i = 0; i < total; i++) {
    const raw = await generateTweet(FRAMES[i], context);
    const numbered = `${i + 1}/${total} ${raw}`;
    thread.push({ id: i + 1, frame: FRAMES[i], content: numbered });
    console.log(`  ${numbered}`);
  }

  console.log('');
  saveThread(thread);
  console.log(`Saved to drafts.json (${thread.length} tweets, Twitter-ready)`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
