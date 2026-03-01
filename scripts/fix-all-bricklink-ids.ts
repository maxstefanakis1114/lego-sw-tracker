/**
 * Scrapes ALL Rebrickable minifig pages to get the correct BrickLink ID
 * for every catalog entry. Caches results to allow resuming.
 *
 * Usage: npx tsx scripts/fix-all-bricklink-ids.ts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import https from 'https';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');
const BRICKSET_CACHE = path.join(import.meta.dirname, '..', '.cache', 'brickset-prices.json');
const ID_CACHE_PATH = path.join(import.meta.dirname, '..', '.cache', 'rebrickable-bricklink-ids.json');

interface BricksetMinifig {
  bricklinkId: string;
  name: string;
  valueNew: number | null;
  valueUsed: number | null;
}

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchPage(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function extractBricklinkId(html: string): string | null {
  const patterns = [
    /bricklink\.com\/v2\/catalog\/catalogitem\.page\?M=([a-z0-9]+)/i,
    /bricklink\.com[^"]*[?&]M=([a-z0-9]+)/i,
    /BrickLink[:\s]+<[^>]*>([a-z]{2,3}\d{3,5}[a-z]?)</i,
    /BrickLink[:\s]*([a-z]{2,3}\d{3,5}[a-z]?)/i,
    /data-bricklink-id="([^"]+)"/i,
    /External IDs[\s\S]{0,500}?BrickLink[\s\S]{0,200}?([a-z]{2,}\d{2,}[a-z]?)/i,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8')) as Array<{ id: string; name: string }>;
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8')) as Record<string, { valueNew: number | null; valueUsed: number | null; bricklinkId: string }>;
  const brickset = JSON.parse(await readFile(BRICKSET_CACHE, 'utf-8')) as BricksetMinifig[];

  // Load cache of already-scraped IDs
  let idCache: Record<string, string | null> = {};
  if (existsSync(ID_CACHE_PATH)) {
    idCache = JSON.parse(await readFile(ID_CACHE_PATH, 'utf-8'));
    console.log(`Loaded ${Object.keys(idCache).length} cached ID lookups`);
  }

  // Build BrickLink ID -> Brickset data map
  const bricksetById = new Map<string, BricksetMinifig>();
  for (const b of brickset) {
    bricksetById.set(b.bricklinkId, b);
  }

  const toScrape = catalog.filter(c => !(c.id in idCache));
  console.log(`Catalog: ${catalog.length} entries`);
  console.log(`Already cached: ${Object.keys(idCache).length}`);
  console.log(`Need to scrape: ${toScrape.length}`);
  console.log(`Estimated time: ${Math.ceil(toScrape.length * 0.8 / 60)} minutes\n`);

  let scraped = 0;
  let errors = 0;

  for (let i = 0; i < toScrape.length; i++) {
    const item = toScrape[i];
    const url = `https://rebrickable.com/minifigs/${item.id}/`;

    try {
      const html = await fetchPage(url);
      const blId = extractBricklinkId(html);
      idCache[item.id] = blId;
      scraped++;

      if (blId) {
        process.stdout.write(`\r[${i + 1}/${toScrape.length}] ${item.id} -> ${blId}        `);
      } else {
        process.stdout.write(`\r[${i + 1}/${toScrape.length}] ${item.id} -> (none)        `);
      }
    } catch (err: any) {
      process.stdout.write(`\r[${i + 1}/${toScrape.length}] ${item.id} -> ERROR: ${err.message}        `);
      idCache[item.id] = null;
      errors++;
    }

    // Save cache every 50 entries
    if ((i + 1) % 50 === 0) {
      await writeFile(ID_CACHE_PATH, JSON.stringify(idCache));
    }

    if (i < toScrape.length - 1) await sleep(700);
  }

  // Final cache save
  await mkdir(path.dirname(ID_CACHE_PATH), { recursive: true });
  await writeFile(ID_CACHE_PATH, JSON.stringify(idCache));
  console.log(`\n\nScraped: ${scraped}, Errors: ${errors}`);

  // Now update prices.json with correct BrickLink IDs
  let updated = 0;
  let added = 0;
  let noBlId = 0;

  for (const item of catalog) {
    const correctBlId = idCache[item.id];
    if (!correctBlId) {
      noBlId++;
      continue;
    }

    const existing = prices[item.id];
    if (existing) {
      if (existing.bricklinkId !== correctBlId) {
        // BrickLink ID was wrong — fix it and update prices from Brickset
        const bsEntry = bricksetById.get(correctBlId);
        prices[item.id] = {
          valueNew: bsEntry?.valueNew ?? existing.valueNew,
          valueUsed: bsEntry?.valueUsed ?? existing.valueUsed,
          bricklinkId: correctBlId,
        };
        updated++;
      }
    } else {
      // New entry
      const bsEntry = bricksetById.get(correctBlId);
      prices[item.id] = {
        valueNew: bsEntry?.valueNew ?? null,
        valueUsed: bsEntry?.valueUsed ?? null,
        bricklinkId: correctBlId,
      };
      added++;
    }
  }

  console.log(`\nPrices updated: ${updated} corrected, ${added} added, ${noBlId} without BrickLink ID`);

  // Check duplicate stats after fix
  const blIds = Object.values(prices).map(p => p.bricklinkId);
  const uniqueIds = new Set(blIds).size;
  const counts: Record<string, number> = {};
  blIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);
  console.log(`Unique BrickLink IDs: ${uniqueIds} (was 823)`);
  console.log(`Remaining duplicates: ${dupes.length}`);

  await writeFile(PRICES_PATH, JSON.stringify(prices, null, 0));
  console.log(`\nWrote ${PRICES_PATH}`);

  // Now update catalog names using the corrected BrickLink IDs
  let namesUpdated = 0;
  for (const item of catalog) {
    const priceEntry = prices[item.id];
    if (!priceEntry?.bricklinkId) continue;
    const bsEntry = bricksetById.get(priceEntry.bricklinkId);
    if (!bsEntry?.name) continue;
    const newName = `${bsEntry.name} (${priceEntry.bricklinkId})`;
    if (item.name !== newName) {
      item.name = newName;
      namesUpdated++;
    }
  }

  await writeFile(CATALOG_PATH, JSON.stringify(catalog));
  console.log(`Updated ${namesUpdated} catalog names`);
  console.log(`\nDone!`);
}

main().catch(console.error);
