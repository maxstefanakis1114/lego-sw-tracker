import { useMemo } from 'react';
import type { CollectionEntry, CatalogMinifig } from '../types';
import { getCatalog } from '../services/catalogService';
import { getMarketPrice } from '../services/priceService';

export interface WantListItem {
  entry: CollectionEntry;
  minifig: CatalogMinifig;
  marketPrice: number | null;
  isDeal: boolean;
}

export function useWantList(collection: Record<string, CollectionEntry>) {
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const wantedItems = useMemo(() => {
    return Object.values(collection)
      .filter(e => e.status === 'wanted')
      .map(entry => {
        const minifig = catalogMap.get(entry.minifigId);
        if (!minifig) return null;
        const marketPrice = getMarketPrice(entry.minifigId);
        const isDeal = entry.targetPrice != null && marketPrice != null && marketPrice <= entry.targetPrice;
        return { entry, minifig, marketPrice, isDeal } as WantListItem;
      })
      .filter(Boolean) as WantListItem[];
  }, [collection, catalogMap]);

  // Sort: deals first, then by priority (high > medium > low > undefined), then by name
  const sorted = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...wantedItems].sort((a, b) => {
      if (a.isDeal !== b.isDeal) return a.isDeal ? -1 : 1;
      const pa = priorityOrder[a.entry.wantPriority ?? ''] ?? 3;
      const pb = priorityOrder[b.entry.wantPriority ?? ''] ?? 3;
      if (pa !== pb) return pa - pb;
      return a.minifig.name.localeCompare(b.minifig.name);
    });
  }, [wantedItems]);

  const dealCount = wantedItems.filter(w => w.isDeal).length;

  return { wantedItems: sorted, dealCount };
}
