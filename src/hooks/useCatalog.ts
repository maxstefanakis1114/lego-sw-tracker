import { useState, useMemo, useCallback } from 'react';
import type { CatalogFilter, CollectionEntry, CatalogMinifig } from '../types';
import { filterCatalog } from '../services/catalogService';

const PAGE_SIZE = 48;

const defaultFilter: CatalogFilter = {
  search: '',
  yearMin: null,
  yearMax: null,
  faction: 'all',
  status: 'all',
  sortBy: 'name',
  sortDir: 'asc',
};

export function useCatalog(collection: Record<string, CollectionEntry>) {
  const [filter, setFilter] = useState<CatalogFilter>(defaultFilter);
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => filterCatalog(filter, collection),
    [filter, collection]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems: CatalogMinifig[] = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const updateFilter = useCallback((updates: Partial<CatalogFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
    setPage(0);
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(defaultFilter);
    setPage(0);
  }, []);

  return {
    filter,
    updateFilter,
    resetFilter,
    filtered,
    pageItems,
    page,
    setPage,
    totalPages,
    totalResults: filtered.length,
  };
}
