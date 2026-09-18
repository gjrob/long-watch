import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const root = read('app/page.tsx');
const observatoryRoute = read('app/observatory/page.tsx');
const observatory = read('components/Observatory.tsx');

test('root is the corporate entry with a verified investigation destination', () => {
  assert.match(root, /We test consequential claims against evidence/);
  assert.match(root, /Machine analysis/);
  assert.match(root, /Human judgment/);
  assert.match(root, /Permanent ledger/);
  assert.match(root, /https:\/\/infrastructure\.longwatch\.win\/index\.php\/2026\/09\/18\/does-a-773-million-funding-gap-mean-wilmingtons-new-bridge-has-to-be-tolled-2\//);
  assert.match(root, /href="\/observatory"/);
  assert.doesNotMatch(root, /href="\/(?:admin|api|dashboard|review)/);
});

test('secondary route renders the live original observatory', () => {
  assert.match(observatoryRoute, /import Observatory from ['"]@\/components\/Observatory['"]/);
  assert.match(observatoryRoute, /<Observatory \/>/);
  assert.match(observatory, /fetch\('\/api\/dashboard'/);
  assert.match(observatory, /POLL_INTERVAL = 30_000/);
  assert.match(observatory, /<ViewToggle mode={mode} onChange={setMode} \/>/);
  for (const component of ['StatusCard', 'RecentDeviations', 'LedgerSnapshot', 'AnomalyLog', 'ProbeLog', 'LedgerChain']) {
    assert.match(observatory, new RegExp('<' + component + '\\b'));
  }
});
