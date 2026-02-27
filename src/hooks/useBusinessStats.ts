import { useMemo } from 'react';
import type { CollectionEntry, SaleRecord, BusinessStats, CatalogMinifig } from '../types';
import { getCatalog } from '../services/catalogService';
import { computeBusinessStats } from '../services/businessStatsService';

export function useBusinessStats(
  collection: Record<string, CollectionEntry>,
  sales: SaleRecord[],
): BusinessStats {
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  return useMemo(
    () => computeBusinessStats(collection, sales, catalogMap),
    [collection, sales, catalogMap],
  );
}
