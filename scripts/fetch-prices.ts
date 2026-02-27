/**
 * Fetches Star Wars minifigure market prices from Brickset
 * and matches them to our Rebrickable catalog by name.
 *
 * Usage: npx tsx scripts/fetch-prices.ts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import https from 'https';

const CATALOG_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const PRICES_OUTPUT = path.join(import.meta.dirname, '..', 'src', 'data', 'prices.json');
const BRICKSET_CACHE = path.join(import.meta.dirname, '..', '.cache', 'brickset-prices.json');
const TOTAL_PAGES = 32;

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
        'Accept': 'text/html,application/xhtml+xml',
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

function parsePricesFromHTML(html: string): BricksetMinifig[] {
  const results: BricksetMinifig[] = [];

  // Each minifig is in an <article class='set'> block
  const blockRegex = /<article[^>]*>[\s\S]*?<\/article>/gi;
  const blocks = html.match(blockRegex) || [];

  for (const block of blocks) {
    // Extract BrickLink ID from the meta div: <span>SW0282: </span>
    const idMatch = block.match(/<span>(sw\d{4}[a-z]?):\s*<\/span>/i)
      || block.match(/\b(sw\d{4}[a-z]?)\b/i);
    if (!idMatch) continue;

    const bricklinkId = idMatch[1].toLowerCase();

    // Extract name from meta h1: <span>SW0282: </span> Name Here</a></h1>
    const nameMatch = block.match(/<div class='meta'>[\s\S]*?<h1><a[^>]*><span>[^<]*<\/span>\s*([^<]+)<\/a><\/h1>/i)
      || block.match(/<h1><a[^>]*>([^<]+)<\/a><\/h1>/i);

    const name = nameMatch ? nameMatch[1].trim() : '';

    // Extract prices from dt/dd pairs:
    // <dt>Value new</dt><dd><a ...>~$14.80</a></dd>
    // <dt>Value used</dt><dd><a ...>~$11.74</a></dd>
    const newPriceMatch = block.match(/<dt>Value new<\/dt>\s*<dd><a[^>]*>~?\$?([\d,]+\.?\d*)<\/a><\/dd>/i);
    const usedPriceMatch = block.match(/<dt>Value used<\/dt>\s*<dd><a[^>]*>~?\$?([\d,]+\.?\d*)<\/a><\/dd>/i);

    const valueNew = newPriceMatch ? parseFloat(newPriceMatch[1].replace(',', '')) : null;
    const valueUsed = usedPriceMatch ? parseFloat(usedPriceMatch[1].replace(',', '')) : null;

    if (name || bricklinkId) {
      results.push({ bricklinkId, name, valueNew, valueUsed });
    }
  }

  return results;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract the "base name" (character name before variant details)
function baseName(name: string): string {
  let base = name.split(/[,(]/)[0].trim();
  base = base.replace(/\s*-\s*$/, '');
  return normalize(base);
}

// Word-level similarity between two strings (Jaccard on words)
function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 1));
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

// Weighted similarity: base name match counts more than variant details
function weightedSimilarity(catalogName: string, bricksetName: string): number {
  const catBase = baseName(catalogName);
  const bsBase = baseName(bricksetName);

  const catBaseWords = new Set(catBase.split(' ').filter(w => w.length > 1));
  const bsBaseWords = new Set(bsBase.split(' ').filter(w => w.length > 1));
  let baseOverlap = 0;
  for (const w of catBaseWords) {
    if (bsBaseWords.has(w)) baseOverlap++;
  }
  if (catBaseWords.size > 0 && baseOverlap === 0) return 0;

  const baseSim = catBaseWords.size > 0 && bsBaseWords.size > 0
    ? baseOverlap / Math.max(catBaseWords.size, bsBaseWords.size)
    : 0;

  const fullSim = wordSimilarity(catalogName, bricksetName);

  return baseSim * 0.7 + fullSim * 0.3;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export async function main() {
  let allMinifigs: BricksetMinifig[];

  // Check for cached Brickset data
  try {
    allMinifigs = JSON.parse(await readFile(BRICKSET_CACHE, 'utf-8'));
    console.log(`Loaded ${allMinifigs.length} cached Brickset entries`);
  } catch {
    console.log('Fetching prices from Brickset...\n');
    allMinifigs = [];

    // Ensure cache directory exists
    await mkdir(path.dirname(BRICKSET_CACHE), { recursive: true });

    for (let page = 1; page <= TOTAL_PAGES; page++) {
      const url = `https://brickset.com/minifigs/category-Star-Wars/page-${page}`;
      console.log(`  Page ${page}/${TOTAL_PAGES}...`);

      try {
        const html = await fetchPage(url);
        const minifigs = parsePricesFromHTML(html);
        allMinifigs.push(...minifigs);
        console.log(`    Found ${minifigs.length} minifigs (total: ${allMinifigs.length})`);
      } catch (err: any) {
        console.log(`    Error: ${err.message}`);
      }

      if (page < TOTAL_PAGES) await sleep(1000);
    }

    // Cache the raw data
    await writeFile(BRICKSET_CACHE, JSON.stringify(allMinifigs));
  }

  console.log(`\nTotal Brickset minifigs: ${allMinifigs.length}`);

  // Show price coverage from Brickset data
  const withNewPrice = allMinifigs.filter(m => m.valueNew !== null).length;
  const withUsedPrice = allMinifigs.filter(m => m.valueUsed !== null).length;
  console.log(`  With new price: ${withNewPrice}`);
  console.log(`  With used price: ${withUsedPrice}`);

  // Load our catalog
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf-8')) as Array<{
    id: string;
    name: string;
  }>;

  // Build multiple indexes for matching
  const byExactName = new Map<string, BricksetMinifig>();
  const byBricklinkId = new Map<string, BricksetMinifig>();
  const byBaseName = new Map<string, BricksetMinifig[]>();
  const allBrickset = allMinifigs;

  for (const m of allMinifigs) {
    byExactName.set(normalize(m.name), m);
    byBricklinkId.set(m.bricklinkId, m);
    const bn = baseName(m.name);
    if (!byBaseName.has(bn)) byBaseName.set(bn, []);
    byBaseName.get(bn)!.push(m);
  }

  // Match catalog entries to prices using multiple strategies
  const prices: Record<string, { valueNew: number | null; valueUsed: number | null; bricklinkId: string }> = {};
  let exactMatches = 0, baseMatches = 0, weightedMatches = 0, levenMatches = 0;

  for (const item of catalog) {
    const normName = normalize(item.name);

    // Strategy 1: Exact normalized name match
    let match = byExactName.get(normName);
    if (match) {
      exactMatches++;
    }

    // Strategy 2: Base name match - pick the one with best word similarity
    if (!match) {
      const bn = baseName(item.name);
      const candidates = byBaseName.get(bn);
      if (candidates && candidates.length > 0) {
        let bestSim = 0;
        for (const c of candidates) {
          const sim = wordSimilarity(item.name, c.name);
          if (sim > bestSim) {
            bestSim = sim;
            match = c;
          }
        }
        if (bestSim >= 0.2) {
          baseMatches++;
        } else {
          match = undefined;
        }
      }
    }

    // Strategy 3: Weighted similarity scan (base name counts more)
    if (!match) {
      let bestSim = 0;
      let bestCandidate: BricksetMinifig | undefined;
      for (const c of allBrickset) {
        const sim = weightedSimilarity(item.name, c.name);
        if (sim > bestSim) {
          bestSim = sim;
          bestCandidate = c;
        }
      }
      if (bestSim >= 0.4 && bestCandidate) {
        match = bestCandidate;
        weightedMatches++;
      }
    }

    // Strategy 4: For short names (<=15 chars), use Levenshtein on base name
    if (!match && baseName(item.name).length <= 15) {
      const catBase = baseName(item.name);
      let bestDist = Infinity;
      let bestCandidate: BricksetMinifig | undefined;
      for (const c of allBrickset) {
        const bsBase = baseName(c.name);
        const dist = levenshtein(catBase, bsBase);
        if (dist < bestDist) {
          bestDist = dist;
          bestCandidate = c;
        }
      }
      if (bestCandidate && bestDist <= Math.max(2, catBase.length * 0.3)) {
        match = bestCandidate;
        levenMatches++;
      }
    }

    if (match) {
      prices[item.id] = {
        valueNew: match.valueNew,
        valueUsed: match.valueUsed,
        bricklinkId: match.bricklinkId,
      };
    }
  }

  const totalMatched = Object.keys(prices).length;
  console.log(`\nMatching results:`);
  console.log(`  Exact: ${exactMatches}`);
  console.log(`  Base name: ${baseMatches}`);
  console.log(`  Weighted: ${weightedMatches}`);
  console.log(`  Levenshtein: ${levenMatches}`);
  console.log(`  Total: ${totalMatched} / ${catalog.length} (${((totalMatched / catalog.length) * 100).toFixed(1)}%)`);

  // Show remaining unmatched
  const unmatched = catalog.filter((c: { id: string }) => !prices[c.id]);
  if (unmatched.length > 0 && unmatched.length <= 50) {
    console.log(`\nStill unmatched (${unmatched.length}):`);
    for (const u of unmatched) {
      console.log(`  ${u.id} | ${u.name}`);
    }
  } else if (unmatched.length > 50) {
    console.log(`\nStill unmatched: ${unmatched.length} items (showing first 20):`);
    for (const u of unmatched.slice(0, 20)) {
      console.log(`  ${u.id} | ${u.name}`);
    }
  }

  await writeFile(PRICES_OUTPUT, JSON.stringify(prices, null, 0));
  console.log(`\nWrote ${PRICES_OUTPUT}`);

  const withPrices = Object.values(prices).filter(p => p.valueUsed !== null);
  console.log(`Entries with used prices: ${withPrices.length}`);

  if (withPrices.length > 0) {
    const avgPrice = withPrices.reduce((s, p) => s + (p.valueUsed || 0), 0) / withPrices.length;
    console.log(`Average used price: $${avgPrice.toFixed(2)}`);
  }
}

const isDirectRun = process.argv[1] && import.meta.filename?.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) main().catch(console.error);
