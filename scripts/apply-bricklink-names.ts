/**
 * Replaces Rebrickable names in catalog.json with BrickLink-style names
 * from the cached Brickset data.
 *
 * Uses prices.json (bricklinkId) to map catalog entries → Brickset names.
 *
 * Usage: npx tsx scripts/apply-bricklink-names.ts
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');
const BRICKSET_CACHE = path.join(import.meta.dirname, '..', '.cache', 'brickset-prices.json');

interface BricksetEntry {
  bricklinkId: string;
  name: string;
  valueNew: number | null;
  valueUsed: number | null;
}

interface CatalogEntry {
  id: string;
  name: string;
  imageUrl: string;
  year: number;
  sets: Array<{ id: string; name: string; year: number }>;
  faction: string;
  numSets: number;
}

async function main() {
  const catalog: CatalogEntry[] = JSON.parse(await readFile(CATALOG_PATH, 'utf-8'));
  const prices: Record<string, { valueNew: number | null; valueUsed: number | null; bricklinkId: string }> =
    JSON.parse(await readFile(PRICES_PATH, 'utf-8'));
  const brickset: BricksetEntry[] = JSON.parse(await readFile(BRICKSET_CACHE, 'utf-8'));

  // Build bricklinkId → name lookup from Brickset
  const blNameMap = new Map<string, string>();
  for (const entry of brickset) {
    if (entry.bricklinkId && entry.name) {
      blNameMap.set(entry.bricklinkId, entry.name);
    }
  }

  console.log(`Catalog: ${catalog.length} entries`);
  console.log(`Prices: ${Object.keys(prices).length} entries with bricklinkId`);
  console.log(`Brickset: ${blNameMap.size} unique bricklinkId → name mappings\n`);

  let updated = 0;
  let notFound = 0;
  const unchanged: string[] = [];

  for (const item of catalog) {
    const priceEntry = prices[item.id];
    if (!priceEntry?.bricklinkId) {
      notFound++;
      unchanged.push(`${item.id} | NO BRICKLINK ID | ${item.name}`);
      continue;
    }

    const blName = blNameMap.get(priceEntry.bricklinkId);
    if (!blName) {
      notFound++;
      unchanged.push(`${item.id} | ${priceEntry.bricklinkId} NOT IN BRICKSET | ${item.name}`);
      continue;
    }

    if (item.name !== blName) {
      item.name = blName;
      updated++;
    }
  }

  console.log(`Updated: ${updated} names`);
  console.log(`Not found: ${notFound}`);
  if (unchanged.length > 0 && unchanged.length <= 30) {
    console.log(`\nUnchanged/missing:`);
    for (const u of unchanged) console.log(`  ${u}`);
  }

  await writeFile(CATALOG_PATH, JSON.stringify(catalog));
  console.log(`\nWrote ${CATALOG_PATH}`);
}

main().catch(console.error);
