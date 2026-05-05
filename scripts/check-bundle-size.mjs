#!/usr/bin/env node
/**
 * Bundle size check. Run after `npm run build`.
 *
 * Enforces a per-chunk budget (gzipped). With manualChunks splitting vendors,
 * any chunk exceeding the budget signals an unintended dependency or a missing
 * split rule. Adjust BUDGET_KB if a vendor chunk is legitimately heavier.
 *
 * Reports total gzipped size of all JS chunks for visibility (not enforced).
 */

import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ASSETS_DIR = 'dist/assets';
const BUDGET_KB = 250; // per-chunk gzipped budget
const BUDGET_BYTES = BUDGET_KB * 1024;

const files = await readdir(ASSETS_DIR);
const jsFiles = files.filter((f) => f.endsWith('.js') && !f.endsWith('.map'));

if (jsFiles.length === 0) {
  console.error('No JS chunks found in dist/assets — did you run `npm run build`?');
  process.exit(1);
}

const sizes = await Promise.all(
  jsFiles.map(async (f) => {
    const buf = await readFile(join(ASSETS_DIR, f));
    return { name: f, raw: buf.length, gzip: gzipSync(buf).length };
  }),
);

sizes.sort((a, b) => b.gzip - a.gzip);

const fmt = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const totalRaw = sizes.reduce((s, c) => s + c.raw, 0);
const totalGzip = sizes.reduce((s, c) => s + c.gzip, 0);
const oversize = sizes.filter((c) => c.gzip > BUDGET_BYTES);

const nameWidth = Math.max(...sizes.map((s) => s.name.length));

console.log(`\nBundle size check — budget per chunk: ${String(BUDGET_KB)} KB gzipped\n`);
console.log(`${'chunk'.padEnd(nameWidth)}  ${'raw'.padStart(10)}  ${'gzip'.padStart(10)}`);
console.log(`${'─'.repeat(nameWidth)}  ${'─'.repeat(10)}  ${'─'.repeat(10)}`);
for (const c of sizes) {
  const flag = c.gzip > BUDGET_BYTES ? '  ✗ OVER' : '';
  console.log(
    `${c.name.padEnd(nameWidth)}  ${fmt(c.raw).padStart(10)}  ${fmt(c.gzip).padStart(10)}${flag}`,
  );
}
console.log(`${'─'.repeat(nameWidth)}  ${'─'.repeat(10)}  ${'─'.repeat(10)}`);
console.log(
  `${'TOTAL'.padEnd(nameWidth)}  ${fmt(totalRaw).padStart(10)}  ${fmt(totalGzip).padStart(10)}\n`,
);

if (oversize.length > 0) {
  console.error(`✗ ${String(oversize.length)} chunk(s) over ${String(BUDGET_KB)} KB gzipped:`);
  for (const c of oversize) {
    console.error(`  - ${c.name}: ${fmt(c.gzip)} (over by ${fmt(c.gzip - BUDGET_BYTES)})`);
  }
  console.error('\nFix: tighten manualChunks in vite.config.ts, or justify and bump BUDGET_KB.');
  process.exit(1);
}

console.log(`✓ All ${String(sizes.length)} chunks under budget.\n`);
