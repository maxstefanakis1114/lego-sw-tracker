import { useMemo } from 'react';
import type { CollectionEntry, CollectionStats } from '../types';
import { getCatalog } from '../services/catalogService';
import { computeStats } from '../services/statsService';

export function useDashboardStats(collection: Record<string, CollectionEntry>): CollectionStats {
  return useMemo(() => computeStats(collection, getCatalog()), [collection]);
}
