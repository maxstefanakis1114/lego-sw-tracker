import type { CollectionEntry, CatalogMinifig } from '../types';
import { getCatalog } from './catalogService';

export interface ParsedSaleRow {
  sku: string;
  title: string;
  quantity: number;
  salePrice: number;
  date: string;
  raw: Record<string, string>;
}

export interface MatchedSale {
  row: ParsedSaleRow;
  minifig: CatalogMinifig | null;
  entry: CollectionEntry | null;
  minifigId: string | null;
}

/** Parse raw CSV text into rows of key-value pairs */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header row (handle quoted values)
  const headers = splitCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Auto-detect column names from headers */
function findColumn(headers: string[], patterns: string[]): string | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const p of patterns) {
    const idx = lower.findIndex(h => h.includes(p));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

/** Parse a Whatnot (or generic) sales CSV and match to collection */
export function parseSalesCSV(
  text: string,
  collection: Record<string, CollectionEntry>,
): MatchedSale[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);

  // Auto-detect columns
  const skuCol = findColumn(headers, ['sku', 'item sku', 'product sku']);
  const titleCol = findColumn(headers, ['title', 'product title', 'item title', 'product name', 'item name', 'name']);
  const qtyCol = findColumn(headers, ['quantity', 'qty', 'units']);
  const priceCol = findColumn(headers, ['price', 'sale price', 'item price', 'amount', 'total']);
  const dateCol = findColumn(headers, ['date', 'sale date', 'order date', 'sold date', 'created']);

  // Build SKU → minifigId lookup from collection
  const skuToId = new Map<string, string>();
  const catalog = getCatalog();
  const catalogById = new Map(catalog.map(m => [m.id, m]));

  for (const [id, entry] of Object.entries(collection)) {
    // Map by custom SKU if set
    if (entry.sku) skuToId.set(entry.sku.toLowerCase(), id);
    // Always map by minifig ID
    skuToId.set(id.toLowerCase(), id);
  }

  const results: MatchedSale[] = [];

  for (const raw of rows) {
    const sku = skuCol ? raw[skuCol] : '';
    const title = titleCol ? raw[titleCol] : '';
    const qtyStr = qtyCol ? raw[qtyCol] : '1';
    const priceStr = priceCol ? raw[priceCol] : '0';
    const date = dateCol ? raw[dateCol] : new Date().toISOString().slice(0, 10);

    const quantity = Math.max(1, parseInt(qtyStr) || 1);
    const salePrice = parseFloat(priceStr.replace(/[$,]/g, '')) || 0;

    // Try to match by SKU
    let minifigId = skuToId.get(sku.toLowerCase()) ?? null;

    // If no SKU match, try matching by title (look for minifig ID pattern like fig-XXXXXX)
    if (!minifigId && title) {
      const figMatch = title.match(/fig-\d+/i);
      if (figMatch) {
        const candidate = figMatch[0].toLowerCase();
        if (collection[candidate]) minifigId = candidate;
      }
    }

    // Also try matching cracked variant SKU (strip -CRACKED suffix)
    if (!minifigId && sku.toLowerCase().endsWith('-cracked')) {
      const baseSku = sku.slice(0, -8);
      minifigId = skuToId.get(baseSku.toLowerCase()) ?? null;
    }

    const parsed: ParsedSaleRow = { sku, title, quantity, salePrice, date, raw };
    const minifig = minifigId ? catalogById.get(minifigId) ?? null : null;
    const entry = minifigId ? collection[minifigId] ?? null : null;

    results.push({ row: parsed, minifig, entry, minifigId });
  }

  return results;
}
