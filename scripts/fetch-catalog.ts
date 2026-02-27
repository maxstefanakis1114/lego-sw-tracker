/**
 * Fetches LEGO Star Wars minifigure data from Rebrickable CSV downloads
 * and produces a static catalog.json for the app.
 *
 * Usage: npx tsx scripts/fetch-catalog.ts
 *
 * Requires REBRICKABLE_API_KEY env var for CSV downloads.
 * Get a free key at https://rebrickable.com/api/
 */

import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import { parse } from 'csv-parse';
import path from 'path';
import https from 'https';

const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache');
const OUTPUT_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');

const CSV_URLS: Record<string, string> = {
  themes: 'https://cdn.rebrickable.com/media/downloads/themes.csv.gz',
  minifigs: 'https://cdn.rebrickable.com/media/downloads/minifigs.csv.gz',
  sets: 'https://cdn.rebrickable.com/media/downloads/sets.csv.gz',
  inventories: 'https://cdn.rebrickable.com/media/downloads/inventories.csv.gz',
  inventory_minifigs: 'https://cdn.rebrickable.com/media/downloads/inventory_minifigs.csv.gz',
};

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log(`  [cached] ${path.basename(dest)}`);
      resolve();
      return;
    }
    console.log(`  [downloading] ${url}`);
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        download(response.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { reject(err); });
  });
}

async function parseCSV<T extends Record<string, string>>(gzPath: string): Promise<T[]> {
  const rows: T[] = [];
  const parser = createReadStream(gzPath)
    .pipe(createGunzip())
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const record of parser) {
    rows.push(record as T);
  }
  return rows;
}

// Recursively find all theme IDs under Star Wars (theme_id=158) + legacy (18)
function getStarWarsThemeIds(themes: Array<{ id: string; parent_id: string }>): Set<string> {
  const SW_ROOT = '158';
  const SW_LEGACY = '18'; // Old "Star Wars" under Technic parent
  const ids = new Set<string>([SW_ROOT, SW_LEGACY]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of themes) {
      if (!ids.has(t.id) && ids.has(t.parent_id)) {
        ids.add(t.id);
        changed = true;
      }
    }
  }
  return ids;
}

// Guess faction from minifig name
function guessFaction(name: string): string {
  const n = name.toLowerCase();
  if (/\b(clone|captain rex|commander (cody|wolffe|bly|gree|fox)|arc trooper|phase)\b/.test(n)) return 'Clone';
  if (/\b(stormtrooper|death trooper|scout trooper|snowtrooper|sandtrooper|imperial|tarkin|moff|at-at driver|tie pilot|officer)\b/.test(n)) return 'Empire';
  if (/\b(first order|captain phasma|kylo|hux|praetorian)\b/.test(n)) return 'First Order';
  if (/\b(rebel|mon mothma|admiral ackbar|leia.*hoth|rebel pilot|a-wing|x-wing pilot|y-wing pilot|b-wing pilot)\b/.test(n)) return 'Rebel Alliance';
  if (/\b(resistance|finn|poe|rose tico)\b/.test(n)) return 'Resistance';
  if (/\b(jedi|luke|obi-wan|anakin|yoda|mace windu|ahsoka|qui-gon|kit fisto|plo koon|aayla|luminara|youngling)\b/.test(n)) return 'Jedi';
  if (/\b(sith|darth|palpatine|emperor|dooku|maul|ventress|inquisitor|savage)\b/.test(n)) return 'Sith';
  if (/\b(mandalorian|boba fett|jango|bo-katan|din djarin|mando|sabine|pre vizsla)\b/.test(n)) return 'Mandalorian';
  if (/\b(bounty|greedo|bossk|dengar|ig-88|4-lom|zuckuss|embo|cad bane|aurra)\b/.test(n)) return 'Bounty Hunter';
  if (/\b(droid|r2|c-3po|bb-8|gonk|battle droid|super battle|commando droid|ig-\d|chopper|k-2so)\b/.test(n)) return 'Droid';
  if (/\b(wookiee|chewbacca|tarfful)\b/.test(n)) return 'Wookiee';
  if (/\b(ewok|wicket)\b/.test(n)) return 'Ewok';
  if (/\b(tusken|jawa|hutt|jabba|gamorrean|twilek|rodian|gungan|jar jar)\b/.test(n)) return 'Civilian';
  if (/\b(han solo|lando|padm|bail)\b/.test(n)) return 'Rebel Alliance';
  return 'Other';
}

interface CatalogMinifig {
  id: string;
  name: string;
  imageUrl: string;
  year: number;
  sets: Array<{ id: string; name: string; year: number }>;
  faction: string;
  numSets: number;
}

export async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });

  console.log('Downloading Rebrickable CSV files...');
  for (const [name, url] of Object.entries(CSV_URLS)) {
    await download(url, path.join(CACHE_DIR, `${name}.csv.gz`));
  }

  console.log('\nParsing CSV files...');
  const [themes, minifigs, sets, inventories, inventoryMinifigs] = await Promise.all([
    parseCSV<{ id: string; name: string; parent_id: string }>(path.join(CACHE_DIR, 'themes.csv.gz')),
    parseCSV<{ fig_num: string; name: string; num_parts: string; img_url: string }>(path.join(CACHE_DIR, 'minifigs.csv.gz')),
    parseCSV<{ set_num: string; name: string; year: string; theme_id: string; num_parts: string; img_url: string }>(path.join(CACHE_DIR, 'sets.csv.gz')),
    parseCSV<{ id: string; version: string; set_num: string }>(path.join(CACHE_DIR, 'inventories.csv.gz')),
    parseCSV<{ inventory_id: string; fig_num: string; quantity: string }>(path.join(CACHE_DIR, 'inventory_minifigs.csv.gz')),
  ]);

  console.log(`  themes: ${themes.length}, minifigs: ${minifigs.length}, sets: ${sets.length}`);
  console.log(`  inventories: ${inventories.length}, inventory_minifigs: ${inventoryMinifigs.length}`);

  // Find all Star Wars theme IDs
  const swThemeIds = getStarWarsThemeIds(themes);
  console.log(`\nStar Wars theme IDs: ${swThemeIds.size}`);

  // Map Star Wars sets
  const swSets = new Map<string, { id: string; name: string; year: number; themeId: string }>();
  for (const s of sets) {
    if (swThemeIds.has(s.theme_id)) {
      swSets.set(s.set_num, { id: s.set_num, name: s.name, year: parseInt(s.year), themeId: s.theme_id });
    }
  }
  console.log(`Star Wars sets: ${swSets.size}`);

  // Build set_num -> inventory_id map (use version 1 when possible)
  const setToInventory = new Map<string, string>();
  for (const inv of inventories) {
    const existing = setToInventory.get(inv.set_num);
    if (!existing || parseInt(inv.version) === 1) {
      setToInventory.set(inv.set_num, inv.id);
    }
  }

  // Build inventory_id -> set_num reverse map (only SW sets)
  const inventoryToSet = new Map<string, string>();
  for (const [setNum] of swSets) {
    const invId = setToInventory.get(setNum);
    if (invId) inventoryToSet.set(invId, setNum);
  }

  // Find which minifigs appear in Star Wars sets
  const figToSets = new Map<string, Set<string>>();
  for (const im of inventoryMinifigs) {
    const setNum = inventoryToSet.get(im.inventory_id);
    if (setNum) {
      if (!figToSets.has(im.fig_num)) figToSets.set(im.fig_num, new Set());
      figToSets.get(im.fig_num)!.add(setNum);
    }
  }

  // Also check for minifig "sets" (fig-XXXX entries in sets table that are SW themed)
  for (const s of sets) {
    if (swThemeIds.has(s.theme_id) && s.set_num.startsWith('fig-')) {
      // Map fig-XXXX set_num to fig_num format — check if there's a matching minifig
      // Rebrickable fig sets use same numbering as minifigs
    }
  }

  console.log(`Minifigs found in SW sets: ${figToSets.size}`);

  // Build minifig lookup
  const minifigMap = new Map<string, { name: string; imgUrl: string }>();
  for (const m of minifigs) {
    minifigMap.set(m.fig_num, { name: m.name, imgUrl: m.img_url || '' });
  }

  // Also include minifigs whose fig_num starts with "sw" (BrickLink-style SW minifigs)
  const swFigNums = new Set<string>();
  for (const m of minifigs) {
    if (m.fig_num.startsWith('fig-')) {
      // Already in figToSets potentially
      if (figToSets.has(m.fig_num)) swFigNums.add(m.fig_num);
    }
  }

  // Combine: all fig_nums that appear in SW sets
  for (const figNum of figToSets.keys()) {
    swFigNums.add(figNum);
  }

  console.log(`Total SW minifig IDs: ${swFigNums.size}`);

  // Build catalog
  const catalog: CatalogMinifig[] = [];
  for (const figNum of swFigNums) {
    const info = minifigMap.get(figNum);
    if (!info) continue;

    const setIds = figToSets.get(figNum) || new Set<string>();
    const figSets: Array<{ id: string; name: string; year: number }> = [];
    let minYear = 9999;

    for (const setId of setIds) {
      const s = swSets.get(setId);
      if (s) {
        figSets.push({ id: s.id, name: s.name, year: s.year });
        if (s.year < minYear) minYear = s.year;
      }
    }

    if (minYear === 9999) minYear = 2000; // fallback

    catalog.push({
      id: figNum,
      name: info.name,
      imageUrl: info.imgUrl,
      year: minYear,
      sets: figSets.sort((a, b) => a.year - b.year),
      faction: guessFaction(info.name),
      numSets: figSets.length,
    });
  }

  catalog.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`\nFinal catalog: ${catalog.length} minifigures`);

  // Faction breakdown
  const factions = new Map<string, number>();
  for (const m of catalog) {
    factions.set(m.faction, (factions.get(m.faction) || 0) + 1);
  }
  console.log('\nFaction breakdown:');
  for (const [f, c] of [...factions.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f}: ${c}`);
  }

  // Year range
  const years = catalog.map(m => m.year).filter(y => y > 1990);
  console.log(`\nYear range: ${Math.min(...years)} - ${Math.max(...years)}`);

  await writeFile(OUTPUT_PATH, JSON.stringify(catalog, null, 0));
  console.log(`\nWrote ${OUTPUT_PATH} (${(JSON.stringify(catalog).length / 1024).toFixed(0)} KB)`);
}

// Run standalone if executed directly
const isDirectRun = process.argv[1] && import.meta.filename?.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) main().catch(console.error);
