import { useState } from 'react';
import type { CatalogMinifig, CollectionEntry, ItemStatus } from '../../types';
import { useCatalog } from '../../hooks/useCatalog';
import { CatalogFilters } from './CatalogFilters';
import { MinifigCard } from './MinifigCard';
import { MinifigDetailModal } from './MinifigDetailModal';
import { Pagination } from '../ui/Pagination';

interface CatalogBrowserProps {
  collection: Record<string, CollectionEntry>;
  onStatusChange: (minifigId: string, status: ItemStatus) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onRemove: (minifigId: string) => void;
}

export function CatalogBrowser({ collection, onStatusChange, onUpdateEntry, onRemove }: CatalogBrowserProps) {
  const { filter, updateFilter, resetFilter, pageItems, page, setPage, totalPages, totalResults } = useCatalog(collection);
  const [selectedMinifig, setSelectedMinifig] = useState<CatalogMinifig | null>(null);

  return (
    <div className="space-y-4">
      <CatalogFilters
        filter={filter}
        onFilterChange={updateFilter}
        onReset={resetFilter}
        totalResults={totalResults}
      />

      {pageItems.length === 0 ? (
        <div className="text-center py-16 text-sw-text-dim">
          <p className="text-lg">No minifigures found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {pageItems.map(m => (
            <MinifigCard
              key={m.id}
              minifig={m}
              entry={collection[m.id]}
              onClick={() => setSelectedMinifig(m)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={totalResults}
      />

      <MinifigDetailModal
        minifig={selectedMinifig}
        entry={selectedMinifig ? collection[selectedMinifig.id] : undefined}
        onClose={() => setSelectedMinifig(null)}
        onStatusChange={onStatusChange}
        onUpdateEntry={onUpdateEntry}
        onRemove={onRemove}
      />
    </div>
  );
}
