/**
 * Fetches actual market prices from BrickLink's official API.
 * Uses OAuth 1.0 authentication and the Price Guide endpoint.
 *
 * Requires env vars:
 *   BRICKLINK_CONSUMER_KEY
 *   BRICKLINK_CONSUMER_SECRET
 *   BRICKLINK_TOKEN
 *   BRICKLINK_TOKEN_SECRET
 *
 * Get credentials at: https://www.bricklink.com/v2/api/register_consumer.page
 *
 * Usage: npx tsx scripts/fetch-bricklink-prices.ts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');
const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache');
const BL_CACHE_PATH = path.join(CACHE_DIR, 'bricklink-api-prices.json');

const API_BASE = 'https://api.bricklink.com/api/store/v1';

interface PriceEntry {
  valueNew: number | null;
  valueUsed: number | null;
  bricklinkId: string;
}

interface BLApiPriceGuide {
  avg_price: string;
  qty_avg_price: string;
  min_price: string;
  max_price: string;
  total_quantity: number;
  unit_quantity: number;
}

interface BLPriceResult {
  avgNew: number | null;
  avgUsed: number | null;
}

// =============================================
// OAuth 1.0 Implementation
// =============================================

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function buildOAuthHeader(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: token,
    oauth_version: '1.0',
  };

  // Combine OAuth params and query params for signature
  const allParams: Record<string, string> = { ...oauthParams, ...queryParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  // Build signature base string
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

  // Sign with HMAC-SHA1
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  // Build Authorization header
  oauthParams['oauth_signature'] = signature;
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// =============================================
// BrickLink API Client
// =============================================

function apiRequest(
  endpoint: string,
  queryParams: Record<string, string>,
  credentials: { consumerKey: string; consumerSecret: string; token: string; tokenSecret: string },
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const authHeader = buildOAuthHeader(
    'GET',
    url,
    queryParams,
    credentials.consumerKey,
    credentials.consumerSecret,
    credentials.token,
    credentials.tokenSecret,
  );

  return new Promise((resolve, reject) => {
    const req = https.get(fullUrl, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API ${res.statusCode}: ${data.substring(0, 200)}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          if (json.meta?.code === 200 || json.meta?.code === undefined) {
            resolve(json.data);
          } else {
            reject(new Error(`API error: ${json.meta?.message || json.meta?.description || 'Unknown'}`));
          }
        } catch {
          reject(new Error(`Invalid JSON: ${data.substring(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPriceForItem(
  blId: string,
  credentials: { consumerKey: string; consumerSecret: string; token: string; tokenSecret: string },
): Promise<BLPriceResult> {
  let avgNew: number | null = null;
  let avgUsed: number | null = null;

  // Fetch "sold" prices (6-month average market price) for both conditions
  try {
    const newData: BLApiPriceGuide = await apiRequest(
      `/items/MINIFIG/${blId}/price`,
      { guide_type: 'sold', new_or_used: 'N', currency_code: 'USD' },
      credentials,
    );
    if (newData && parseFloat(newData.qty_avg_price) > 0) {
      avgNew = parseFloat(parseFloat(newData.qty_avg_price).toFixed(2));
    } else if (newData && parseFloat(newData.avg_price) > 0) {
      avgNew = parseFloat(parseFloat(newData.avg_price).toFixed(2));
    }
  } catch {
    // No new price data available
  }

  await sleep(300); // Small delay between paired requests

  try {
    const usedData: BLApiPriceGuide = await apiRequest(
      `/items/MINIFIG/${blId}/price`,
      { guide_type: 'sold', new_or_used: 'U', currency_code: 'USD' },
      credentials,
    );
    if (usedData && parseFloat(usedData.qty_avg_price) > 0) {
      avgUsed = parseFloat(parseFloat(usedData.qty_avg_price).toFixed(2));
    } else if (usedData && parseFloat(usedData.avg_price) > 0) {
      avgUsed = parseFloat(parseFloat(usedData.avg_price).toFixed(2));
    }
  } catch {
    // No used price data available
  }

  // If no sold data, try "stock" (currently listed) prices as fallback
  if (avgNew === null && avgUsed === null) {
    try {
      const stockData: BLApiPriceGuide = await apiRequest(
        `/items/MINIFIG/${blId}/price`,
        { guide_type: 'stock', new_or_used: 'N', currency_code: 'USD' },
        credentials,
      );
      if (stockData && parseFloat(stockData.avg_price) > 0) {
        avgNew = parseFloat(parseFloat(stockData.avg_price).toFixed(2));
      }
    } catch { /* ignore */ }

    await sleep(300);

    try {
      const stockData: BLApiPriceGuide = await apiRequest(
        `/items/MINIFIG/${blId}/price`,
        { guide_type: 'stock', new_or_used: 'U', currency_code: 'USD' },
        credentials,
      );
      if (stockData && parseFloat(stockData.avg_price) > 0) {
        avgUsed = parseFloat(parseFloat(stockData.avg_price).toFixed(2));
      }
    } catch { /* ignore */ }
  }

  return { avgNew, avgUsed };
}

// =============================================
// Main
// =============================================

export async function main() {
  const consumerKey = process.env.BRICKLINK_CONSUMER_KEY;
  const consumerSecret = process.env.BRICKLINK_CONSUMER_SECRET;
  const token = process.env.BRICKLINK_TOKEN;
  const tokenSecret = process.env.BRICKLINK_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !token || !tokenSecret) {
    console.error('Missing BrickLink API credentials. Set these env vars:');
    console.error('  BRICKLINK_CONSUMER_KEY');
    console.error('  BRICKLINK_CONSUMER_SECRET');
    console.error('  BRICKLINK_TOKEN');
    console.error('  BRICKLINK_TOKEN_SECRET');
    console.error('\nRegister at: https://www.bricklink.com/v2/api/register_consumer.page');
    process.exit(1);
  }

  const credentials = { consumerKey, consumerSecret, token, tokenSecret };

  await mkdir(CACHE_DIR, { recursive: true });

  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8')) as Array<{ id: string; name: string }>;
  const prices = JSON.parse(await readFile(PRICES_PATH, 'utf-8')) as Record<string, PriceEntry>;

  // Load BrickLink API price cache (resume interrupted runs)
  let blCache: Record<string, BLPriceResult> = {};
  try {
    if (existsSync(BL_CACHE_PATH)) {
      blCache = JSON.parse(await readFile(BL_CACHE_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }

  // Collect unique BrickLink IDs to fetch
  const idToFigNums = new Map<string, string[]>();
  for (const item of catalog) {
    const p = prices[item.id];
    if (p?.bricklinkId) {
      const blId = p.bricklinkId;
      if (!idToFigNums.has(blId)) idToFigNums.set(blId, []);
      idToFigNums.get(blId)!.push(item.id);
    }
  }

  const uniqueIds = [...idToFigNums.keys()];
  const uncached = uniqueIds.filter(id => !(id in blCache));

  console.log(`Catalog: ${catalog.length} items`);
  console.log(`With BrickLink ID: ${uniqueIds.length} unique IDs`);
  console.log(`Already cached: ${uniqueIds.length - uncached.length}`);
  console.log(`To fetch: ${uncached.length}`);

  if (uncached.length > 0) {
    const estMinutes = Math.ceil(uncached.length * 1 / 60);
    console.log(`\nFetching from BrickLink API (~${estMinutes} min)...\n`);
  }

  // Test API credentials with first item
  if (uncached.length > 0) {
    const testId = uncached[0];
    console.log(`Testing API credentials with ${testId}...`);
    try {
      const result = await fetchPriceForItem(testId, credentials);
      blCache[testId] = result;
      console.log(`  OK: New=$${result.avgNew ?? '?'}, Used=$${result.avgUsed ?? '?'}\n`);
    } catch (err: any) {
      console.error(`  API authentication failed: ${err.message}`);
      console.error('  Check your BrickLink API credentials.');
      process.exit(1);
    }
  }

  let fetched = 0;
  let withPrices = 0;
  let noPrices = 0;
  let errors = 0;

  // Start from index 1 since we already tested index 0
  for (let i = 1; i < uncached.length; i++) {
    const blId = uncached[i];

    if ((i + 1) % 50 === 0 || i === 1) {
      console.log(`  [${i + 1}/${uncached.length}] Fetching ${blId}...`);
    }

    try {
      const result = await fetchPriceForItem(blId, credentials);
      blCache[blId] = result;
      fetched++;

      if (result.avgNew !== null || result.avgUsed !== null) {
        withPrices++;
      } else {
        noPrices++;
        if (noPrices <= 20) {
          const figNums = idToFigNums.get(blId) || [];
          console.log(`    No price data: ${blId} (${figNums[0]})`);
        }
      }
    } catch (err: any) {
      errors++;
      blCache[blId] = { avgNew: null, avgUsed: null };
      if (errors <= 10) {
        console.log(`    Error for ${blId}: ${err.message}`);
      }
    }

    // Save cache every 100 items
    if ((i + 1) % 100 === 0) {
      await writeFile(BL_CACHE_PATH, JSON.stringify(blCache));
      console.log(`  [saved cache at ${i + 1}/${uncached.length}]`);
    }

    // Rate limit: ~1 item per second (2 API calls each with 300ms gap)
    await sleep(400);
  }

  // Count first test item in stats
  if (uncached.length > 0) {
    const firstResult = blCache[uncached[0]];
    fetched++;
    if (firstResult?.avgNew !== null || firstResult?.avgUsed !== null) {
      withPrices++;
    } else {
      noPrices++;
    }
  }

  // Save final cache
  await writeFile(BL_CACHE_PATH, JSON.stringify(blCache));

  if (uncached.length > 0) {
    console.log(`\nFetch results:`);
    console.log(`  Fetched: ${fetched}`);
    console.log(`  With prices: ${withPrices}`);
    console.log(`  No price data: ${noPrices}`);
    console.log(`  Errors: ${errors}`);
  }

  // Apply BrickLink API prices to all items
  let updated = 0;
  let kept = 0;

  for (const item of catalog) {
    const p = prices[item.id];
    if (!p?.bricklinkId) continue;

    const bl = blCache[p.bricklinkId];
    if (!bl) continue;

    if (bl.avgNew !== null || bl.avgUsed !== null) {
      prices[item.id] = {
        ...p,
        valueNew: bl.avgNew,
        valueUsed: bl.avgUsed,
      };
      updated++;
    } else {
      if (p.valueNew !== null || p.valueUsed !== null) {
        kept++;
      }
    }
  }

  await writeFile(PRICES_PATH, JSON.stringify(prices, null, 0));

  const totalWithPrices = Object.values(prices).filter(p => p.valueUsed !== null || p.valueNew !== null).length;
  console.log(`\nBrickLink prices applied: ${updated}`);
  console.log(`Kept existing prices: ${kept}`);
  console.log(`Total with prices: ${totalWithPrices} / ${catalog.length} (${((totalWithPrices / catalog.length) * 100).toFixed(1)}%)`);

  // Show sample prices
  const samples = catalog.slice(0, 5);
  console.log(`\nSample prices (BrickLink 6-month sold avg):`);
  for (const s of samples) {
    const p = prices[s.id];
    if (p) {
      console.log(`  ${s.id} (${p.bricklinkId}) ${s.name}: New=$${p.valueNew ?? '?'} Used=$${p.valueUsed ?? '?'}`);
    }
  }
}

const isDirectRun = process.argv[1] && import.meta.filename?.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) main().catch(console.error);
