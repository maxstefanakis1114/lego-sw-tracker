/**
 * Fetch prices for the last few items that have BrickLink IDs
 * but no Brickset price, by scraping Brickset directly by BrickLink ID.
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import https from 'https';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');

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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8')) as Array<{ id: string; name: string }>;
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8')) as Record<string, { valueNew: number | null; valueUsed: number | null; bricklinkId: string }>;

  // Find items with BrickLink ID but no price
  const noPriceItems = catalog.filter(c => {
    const p = prices[c.id];
    return p && p.valueUsed === null && p.valueNew === null;
  });

  console.log(`Items with BrickLink ID but no price: ${noPriceItems.length}`);

  for (let i = 0; i < noPriceItems.length; i++) {
    const item = noPriceItems[i];
    const p = prices[item.id];
    const blId = p.bricklinkId;
    console.log(`[${i + 1}/${noPriceItems.length}] ${item.id} (${blId}) - ${item.name}`);

    // Try Brickset search by BrickLink ID
    try {
      const url = `https://brickset.com/minifigs?query=${blId}`;
      const html = await fetchPage(url);

      // Extract price from the search results
      const priceMatch = html.match(new RegExp(`${blId}[\\s\\S]{0,2000}?Value new[^~]*~\\$(\\d+\\.?\\d*)[\\s\\S]{0,200}?Value used[^~]*~\\$(\\d+\\.?\\d*)`, 'i'))
        || html.match(new RegExp(`\\$(\\d+\\.?\\d*)[\\s\\S]{0,500}?\\$(\\d+\\.?\\d*)`, 'i'));

      if (priceMatch) {
        const valueNew = parseFloat(priceMatch[1]);
        const valueUsed = priceMatch[2] ? parseFloat(priceMatch[2]) : null;
        prices[item.id] = { ...p, valueNew, valueUsed };
        console.log(`  -> New: $${valueNew}, Used: $${valueUsed}`);
      } else {
        // Try BrickLink price guide page directly
        const blUrl = `https://www.bricklink.com/v2/catalog/catalogitem.page?M=${blId}#T=P`;
        console.log(`  -> No Brickset result, trying BrickLink...`);
        // BrickLink usually blocks, but let's try
        try {
          const blHtml = await fetchPage(blUrl);
          const blPriceMatch = blHtml.match(/Avg Price[^$]*\$(\d+\.?\d*)/i);
          if (blPriceMatch) {
            const avg = parseFloat(blPriceMatch[1]);
            prices[item.id] = { ...p, valueUsed: avg, valueNew: null };
            console.log(`  -> BrickLink avg: $${avg}`);
          } else {
            console.log(`  -> No price found anywhere`);
          }
        } catch {
          console.log(`  -> BrickLink also failed`);
        }
      }
    } catch (err: any) {
      console.log(`  -> Error: ${err.message}`);
    }

    if (i < noPriceItems.length - 1) await sleep(1000);
  }

  const totalWithPrices = Object.values(prices).filter(p => p.valueUsed !== null || p.valueNew !== null).length;
  console.log(`\nTotal with prices: ${totalWithPrices} / ${catalog.length} (${((totalWithPrices / catalog.length) * 100).toFixed(1)}%)`);

  // Show remaining without prices
  const stillMissing = catalog.filter(c => {
    const p = prices[c.id];
    return !p || (p.valueUsed === null && p.valueNew === null);
  });
  if (stillMissing.length > 0) {
    console.log(`\nStill missing prices (${stillMissing.length}):`);
    for (const m of stillMissing) {
      console.log(`  ${m.id} (${prices[m.id]?.bricklinkId}) | ${m.name}`);
    }
  }

  await writeFile(PRICES_PATH, JSON.stringify(prices, null, 0));
  console.log(`\nUpdated ${PRICES_PATH}`);
}

const isDirectRun = process.argv[1] && import.meta.filename?.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) main().catch(console.error);
