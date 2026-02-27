/**
 * For unmatched catalog entries, scrape Rebrickable pages to get BrickLink IDs,
 * then match by BrickLink ID to Brickset price data.
 *
 * Usage: npx tsx scripts/fix-unmatched.ts
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import https from 'https';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');
const BRICKSET_CACHE = path.join(import.meta.dirname, '..', '.cache', 'brickset-prices.json');

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
  // Look for BrickLink ID pattern on Rebrickable minifig page
  // Usually shown as "BrickLink: sw0001" or in a link to bricklink.com
  const patterns = [
    /bricklink\.com\/v2\/catalog\/catalogitem\.page\?M=([a-z0-9]+)/i,
    /bricklink\.com[^"]*[?&]M=([a-z0-9]+)/i,
    /BrickLink[:\s]+<[^>]*>([a-z]{2,3}\d{3,5}[a-z]?)</i,
    /BrickLink[:\s]*([a-z]{2,3}\d{3,5}[a-z]?)/i,
    /data-bricklink-id="([^"]+)"/i,
    />([a-z]{2}\d{4}[a-z]?)<\/a>\s*<\/td>\s*<\/tr>\s*<tr[^>]*>\s*<td[^>]*>BrickLink/i,
    /External IDs[\s\S]{0,500}?BrickLink[\s\S]{0,200}?([a-z]{2}\d{4}[a-z]?)/i,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

export async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8')) as Array<{ id: string; name: string }>;
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8')) as Record<string, { valueNew: number | null; valueUsed: number | null; bricklinkId: string }>;
  const brickset = JSON.parse(await readFile(BRICKSET_CACHE, 'utf-8')) as BricksetMinifig[];

  // Build BrickLink ID -> Brickset price map
  const bricksetById = new Map<string, BricksetMinifig>();
  for (const b of brickset) {
    bricksetById.set(b.bricklinkId, b);
  }

  const unmatched = catalog.filter(c => !(c.id in prices));
  console.log(`Unmatched entries: ${unmatched.length}`);
  console.log(`Brickset entries available: ${brickset.length}`);
  console.log();

  let found = 0;
  let notOnBricklink = 0;
  let noPrice = 0;
  let errors = 0;

  for (let i = 0; i < unmatched.length; i++) {
    const item = unmatched[i];
    const url = `https://rebrickable.com/minifigs/${item.id}/`;
    console.log(`[${i + 1}/${unmatched.length}] ${item.id} - ${item.name}`);

    try {
      const html = await fetchPage(url);
      const blId = extractBricklinkId(html);

      if (blId) {
        const bsEntry = bricksetById.get(blId);
        if (bsEntry) {
          prices[item.id] = {
            valueNew: bsEntry.valueNew,
            valueUsed: bsEntry.valueUsed,
            bricklinkId: blId,
          };
          console.log(`  -> ${blId} = $${bsEntry.valueUsed ?? bsEntry.valueNew ?? '?'}`);
          found++;
        } else {
          // Have BrickLink ID but no Brickset price - try fetching from Brickset directly
          console.log(`  -> ${blId} (no Brickset price)`);
          noPrice++;
          // Still save the BrickLink ID even without price
          prices[item.id] = {
            valueNew: null,
            valueUsed: null,
            bricklinkId: blId,
          };
        }
      } else {
        console.log(`  -> No BrickLink ID found on page`);
        notOnBricklink++;
      }
    } catch (err: any) {
      console.log(`  -> Error: ${err.message}`);
      errors++;
    }

    if (i < unmatched.length - 1) await sleep(800);
  }

  console.log(`\nResults:`);
  console.log(`  Found with price: ${found}`);
  console.log(`  BrickLink ID but no price: ${noPrice}`);
  console.log(`  No BrickLink ID: ${notOnBricklink}`);
  console.log(`  Errors: ${errors}`);

  const totalWithPrices = Object.values(prices).filter(p => p.valueUsed !== null || p.valueNew !== null).length;
  console.log(`\nTotal catalog entries with prices: ${totalWithPrices} / ${catalog.length} (${((totalWithPrices / catalog.length) * 100).toFixed(1)}%)`);
  console.log(`Total catalog entries with BrickLink ID: ${Object.keys(prices).length} / ${catalog.length}`);

  await writeFile(PRICES_PATH, JSON.stringify(prices, null, 0));
  console.log(`\nUpdated ${PRICES_PATH}`);
}

const isDirectRun = process.argv[1] && import.meta.filename?.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) main().catch(console.error);
