import type { CatalogMinifig, CollectionEntry, CollectionStats } from '../types';

export function computeStats(
  collection: Record<string, CollectionEntry>,
  catalog: CatalogMinifig[]
): CollectionStats {
  const entries = Object.values(collection);

  const totalOwned = entries.filter(e => e.status === 'owned').reduce((s, e) => s + e.quantity, 0);
  const totalWanted = entries.filter(e => e.status === 'wanted').length;
  const totalForSale = entries.filter(e => e.status === 'for-sale').reduce((s, e) => s + e.quantity, 0);
  const totalSold = entries.filter(e => e.status === 'sold').reduce((s, e) => s + e.quantity, 0);

  const uniqueOwned = new Set(
    entries.filter(e => e.status === 'owned' || e.status === 'for-sale' || e.status === 'sold').map(e => e.minifigId)
  );
  const totalInCollection = uniqueOwned.size;
  const catalogSize = catalog.length;
  const completionPercent = catalogSize > 0 ? (totalInCollection / catalogSize) * 100 : 0;

  const totalPaid = entries.reduce((s, e) => s + (e.pricePaid ?? 0) * e.quantity, 0);
  const totalSoldValue = entries
    .filter(e => e.status === 'sold')
    .reduce((s, e) => s + (e.priceSold ?? 0) * e.quantity, 0);
  const totalAskingValue = entries
    .filter(e => e.status === 'for-sale')
    .reduce((s, e) => s + (e.askingPrice ?? 0) * e.quantity, 0);

  // Faction breakdown
  const catalogById = new Map(catalog.map(m => [m.id, m]));
  const factionCounts = new Map<string, { count: number; total: number }>();
  for (const m of catalog) {
    if (!factionCounts.has(m.faction)) factionCounts.set(m.faction, { count: 0, total: 0 });
    factionCounts.get(m.faction)!.total++;
  }
  for (const e of entries) {
    const m = catalogById.get(e.minifigId);
    if (m && (e.status === 'owned' || e.status === 'for-sale')) {
      if (!factionCounts.has(m.faction)) factionCounts.set(m.faction, { count: 0, total: 0 });
      factionCounts.get(m.faction)!.count++;
    }
  }
  const factionBreakdown = [...factionCounts.entries()]
    .map(([faction, { count, total }]) => ({ faction, count, total }))
    .sort((a, b) => b.total - a.total);

  // Year breakdown (owned only)
  const yearCounts = new Map<number, number>();
  for (const e of entries) {
    if (e.status === 'owned' || e.status === 'for-sale') {
      const m = catalogById.get(e.minifigId);
      if (m) {
        yearCounts.set(m.year, (yearCounts.get(m.year) || 0) + 1);
      }
    }
  }
  const yearBreakdown = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Recent activity (last 10 modified)
  const recentActivity = entries
    .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
    .slice(0, 10)
    .map(entry => {
      const minifig = catalogById.get(entry.minifigId);
      return minifig ? { entry, minifig } : null;
    })
    .filter(Boolean) as Array<{ entry: CollectionEntry; minifig: CatalogMinifig }>;

  return {
    totalOwned,
    totalWanted,
    totalForSale,
    totalSold,
    totalInCollection,
    catalogSize,
    completionPercent,
    totalPaid,
    totalSoldValue,
    totalAskingValue,
    factionBreakdown,
    yearBreakdown,
    recentActivity,
  };
}
