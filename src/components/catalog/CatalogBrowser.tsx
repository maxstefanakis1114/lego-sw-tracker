import { useState } from 'react';
import type { CatalogMinifig, CollectionEntry, ItemStatus, ItemCondition } from '../../types';
import { useCatalog } from '../../hooks/useCatalog';
import { CatalogFilters } from './CatalogFilters';
import { MinifigCard } from './MinifigCard';
import { MinifigDetailModal } from './MinifigDetailModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { ScanModal } from './ScanModal';
import { ScanSettingsModal } from './ScanSettingsModal';
import { Pagination } from '../ui/Pagination';

interface CatalogBrowserProps {
  collection: Record<string, CollectionEntry>;
  onStatusChange: (minifigId: string, status: ItemStatus) => void;
  onAddWithQuantity: (minifigId: string, quantity: number, forSaleQuantity: number, condition: ItemCondition, pricePaid: number | null) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onRemove: (minifigId: string) => void;
}

export function CatalogBrowser({ collection, onStatusChange, onAddWithQuantity, onUpdateEntry, onRemove }: CatalogBrowserProps) {
  const { filter, updateFilter, resetFilter, pageItems, page, setPage, totalPages, totalResults } = useCatalog(collection);
  const [selectedMinifig, setSelectedMinifig] = useState<CatalogMinifig | null>(null);
  const [addMinifig, setAddMinifig] = useState<CatalogMinifig | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCardClick = (minifig: CatalogMinifig) => {
    if (collection[minifig.id]) {
      setSelectedMinifig(minifig);
    } else {
      setAddMinifig(minifig);
    }
  };

  const handleScanMatch = (minifig: CatalogMinifig) => {
    if (collection[minifig.id]) {
      setSelectedMinifig(minifig);
    } else {
      setAddMinifig(minifig);
    }
  };

  return (
    <div className="space-y-4">
      <CatalogFilters
        filter={filter}
        onFilterChange={updateFilter}
        onReset={resetFilter}
        onScan={() => setScanOpen(true)}
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
              onClick={() => handleCardClick(m)}
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

      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onMatch={handleScanMatch}
        onOpenSettings={() => { setScanOpen(false); setSettingsOpen(true); }}
      />

      <ScanSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <AddToCollectionModal
        minifig={addMinifig}
        onClose={() => setAddMinifig(null)}
        onAdd={onAddWithQuantity}
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
