/**
 * Unified data refresh pipeline.
 *
 * Pipeline:
 *   1. Fetch catalog from Rebrickable (CSV downloads)
 *   2. Get BrickLink ID mapping from Brickset (name matching)
 *   3. Fill missing IDs from Rebrickable pages
 *   4. Fetch prices from BrickLink API (6-month sold averages)
 *   5. Apply manual overrides for items BrickLink can't price
 *
 * Usage:
 *   npx tsx scripts/refresh.ts              # Full refresh (clears cache)
 *   npx tsx scripts/refresh.ts --use-cache  # Reuse cached data
 *
 * Required env vars:
 *   REBRICKABLE_API_KEY          — for catalog fetch
 *   BRICKLINK_CONSUMER_KEY       — for price API
 *   BRICKLINK_CONSUMER_SECRET
 *   BRICKLINK_TOKEN
 *   BRICKLINK_TOKEN_SECRET
 */

import { readFile, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { main as fetchCatalog } from './fetch-catalog.js';
import { main as fetchIdMapping } from './fetch-prices.js';
import { main as fixUnmatched } from './fix-unmatched.js';
import { main as fetchBricklinkPrices } from './fetch-bricklink-prices.js';

const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache');
const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');

// Manual price overrides for items BrickLink can't price (Big Figs, animals)
// Last verified: Feb 2026
const MANUAL_OVERRIDES: Record<string, { valueNew: number; valueUsed: number; bricklinkId: string }> = {
  'fig-003838': { valueNew: 53.74, valueUsed: 38.00, bricklinkId: 'wampa' },
  'fig-011198': { valueNew: 53.74, valueUsed: 38.00, bricklinkId: 'wampa' },
  'fig-014399': { valueNew: 18.00, valueUsed: 12.00, bricklinkId: 'porg06' },
  'fig-014402': { valueNew: 15.00, valueUsed: 10.00, bricklinkId: 'porg03' },
  'fig-014403': { valueNew: 20.00, valueUsed: 14.00, bricklinkId: 'porg02' },
  'fig-014404': { valueNew: 15.00, valueUsed: 10.00, bricklinkId: 'porg01' },
};

async function applyManualOverrides() {
  console.log('\n=== Step 5: Applying manual price overrides ===\n');
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8'));

  let applied = 0;
  for (const [id, data] of Object.entries(MANUAL_OVERRIDES)) {
    const existing = prices[id];
    // Only override if BrickLink didn't return prices
    if (!existing || (existing.valueNew === null && existing.valueUsed === null)) {
      prices[id] = { ...existing, ...data };
      applied++;
    }
  }

  await writeFile(PRICES_PATH, JSON.stringify(prices));
  console.log(`Applied ${applied} manual overrides (${Object.keys(MANUAL_OVERRIDES).length - applied} already had BrickLink prices)`);
}

async function printSummary() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8'));
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8'));

  let withPrices = 0;
  let noPrices = 0;
  const missing: string[] = [];
  for (const c of catalog) {
    const p = prices[c.id];
    if (p && (p.valueUsed != null || p.valueNew != null)) {
      withPrices++;
    } else {
      noPrices++;
      if (missing.length < 10) missing.push(`  ${c.id} | ${c.name}`);
    }
  }

  console.log('\n========================================');
  console.log('         REFRESH COMPLETE');
  console.log('========================================');
  console.log(`Catalog:  ${catalog.length} minifigs`);
  console.log(`Prices:   ${withPrices} / ${catalog.length} (${((withPrices / catalog.length) * 100).toFixed(1)}%)`);
  console.log(`Source:   BrickLink API (6-month sold avg)`);
  if (noPrices > 0) {
    console.log(`Missing:  ${noPrices}`);
    for (const m of missing) console.log(m);
  }
  console.log('========================================\n');
}

async function main() {
  const useCache = process.argv.includes('--use-cache');

  if (!useCache && existsSync(CACHE_DIR)) {
    console.log('Clearing cache...\n');
    await rm(CACHE_DIR, { recursive: true, force: true });
  }

  console.log('=== Step 1: Fetching catalog from Rebrickable ===\n');
  await fetchCatalog();

  console.log('\n=== Step 2: Getting BrickLink ID mapping from Brickset ===\n');
  await fetchIdMapping();

  console.log('\n=== Step 3: Filling missing IDs from Rebrickable ===\n');
  await fixUnmatched();

  console.log('\n=== Step 4: Fetching prices from BrickLink API ===\n');
  await fetchBricklinkPrices();

  await applyManualOverrides();
  await printSummary();
}

main().catch((err) => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
