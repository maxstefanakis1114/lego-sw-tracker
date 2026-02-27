import type { CatalogMinifig, CatalogFilter, CollectionEntry } from '../types';
import rawCatalog from '../data/catalog.json';

const catalog: CatalogMinifig[] = rawCatalog as CatalogMinifig[];

export function getCatalog(): CatalogMinifig[] {
  return catalog;
}

export function getMinifig(id: string): CatalogMinifig | undefined {
  return catalog.find(m => m.id === id);
}

export function getAllFactions(): string[] {
  const factions = new Set<string>();
  for (const m of catalog) factions.add(m.faction);
  return [...factions].sort();
}

export function getYearRange(): [number, number] {
  let min = 9999, max = 0;
  for (const m of catalog) {
    if (m.year < min) min = m.year;
    if (m.year > max) max = m.year;
  }
  return [min, max];
}

export function filterCatalog(
  filter: CatalogFilter,
  collection: Record<string, CollectionEntry>
): CatalogMinifig[] {
  let results = catalog;

  if (filter.search) {
    const q = filter.search.toLowerCase();
    results = results.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.sets.some(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  }

  if (filter.yearMin !== null) {
    results = results.filter(m => m.year >= filter.yearMin!);
  }
  if (filter.yearMax !== null) {
    results = results.filter(m => m.year <= filter.yearMax!);
  }

  if (filter.faction && filter.faction !== 'all') {
    results = results.filter(m => m.faction === filter.faction);
  }

  if (filter.status && filter.status !== 'all') {
    if (filter.status === 'none') {
      results = results.filter(m => !collection[m.id]);
    } else {
      results = results.filter(m => collection[m.id]?.status === filter.status);
    }
  }

  const dir = filter.sortDir === 'desc' ? -1 : 1;
  results = [...results].sort((a, b) => {
    switch (filter.sortBy) {
      case 'name': return dir * a.name.localeCompare(b.name);
      case 'year': return dir * (a.year - b.year);
      case 'id': return dir * a.id.localeCompare(b.id);
      case 'value': {
        const aPrice = collection[a.id]?.askingPrice ?? collection[a.id]?.pricePaid ?? 0;
        const bPrice = collection[b.id]?.askingPrice ?? collection[b.id]?.pricePaid ?? 0;
        return dir * (aPrice - bPrice);
      }
      default: return 0;
    }
  });

  return results;
}
