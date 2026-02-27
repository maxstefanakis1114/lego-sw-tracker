import { useState, useMemo } from 'react';
import type { CatalogMinifig, CollectionEntry, ItemStatus } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { useWantList } from '../../hooks/useWantList';
import { CollectionFilters } from './CollectionFilters';
import { WantListItem } from './WantListItem';
import { FoundItModal } from './FoundItModal';
import { MinifigCard } from '../catalog/MinifigCard';
import { MinifigDetailModal } from '../catalog/MinifigDetailModal';
import { FolderHeart, Zap } from 'lucide-react';

interface CollectionViewProps {
  collection: Record<string, CollectionEntry>;
  onStatusChange: (minifigId: string, status: ItemStatus) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onRemove: (minifigId: string) => void;
}

export function CollectionView({ collection, onStatusChange, onUpdateEntry, onRemove }: CollectionViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [selectedMinifig, setSelectedMinifig] = useState<CatalogMinifig | null>(null);
  const [foundItMinifigId, setFoundItMinifigId] = useState<string | null>(null);

  const { wantedItems, dealCount } = useWantList(collection);

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const items = useMemo(() => {
    let entries = Object.values(collection);

    if (statusFilter !== 'all') {
      entries = entries.filter(e => e.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e => {
        const m = catalogMap.get(e.minifigId);
        return m && (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          e.sku.toLowerCase().includes(q)
        );
      });
    }

    return entries
      .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
      .map(entry => ({ entry, minifig: catalogMap.get(entry.minifigId)! }))
      .filter(item => item.minifig);
  }, [collection, statusFilter, search, catalogMap]);

  const counts = useMemo(() => {
    const c = { all: 0, owned: 0, wanted: 0, 'for-sale': 0, sold: 0 };
    for (const e of Object.values(collection)) {
      c.all++;
      c[e.status]++;
    }
    return c;
  }, [collection]);

  // Show enhanced wanted view
  const showWantList = statusFilter === 'wanted';

  return (
    <div className="space-y-4">
      <CollectionFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dealCount={dealCount}
      />

      <div className="text-sm text-sw-text-dim">
        {items.length} of {counts[statusFilter === 'all' ? 'all' : statusFilter]} items
        {showWantList && dealCount > 0 && (
          <span className="ml-2 text-sw-green">
            <Zap size={12} className="inline" /> {dealCount} deal{dealCount !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-sw-text-dim">
          <FolderHeart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">
            {Object.keys(collection).length === 0
              ? 'Your collection is empty'
              : 'No items match your filters'
            }
          </p>
          <p className="text-sm mt-1">
            {Object.keys(collection).length === 0
              ? 'Browse the catalog and start adding minifigures!'
              : 'Try adjusting your search or status filter'
            }
          </p>
        </div>
      ) : showWantList ? (
        // Enhanced wanted list view
        <div className="space-y-2">
          {wantedItems
            .filter(item => {
              if (!search) return true;
              const q = search.toLowerCase();
              return item.minifig.name.toLowerCase().includes(q) ||
                item.minifig.id.toLowerCase().includes(q);
            })
            .map(item => (
              <WantListItem
                key={item.entry.minifigId}
                item={item}
                onClick={() => setSelectedMinifig(item.minifig)}
                onFoundIt={() => setFoundItMinifigId(item.entry.minifigId)}
              />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(({ entry, minifig }) => (
            <MinifigCard
              key={entry.minifigId}
              minifig={minifig}
              entry={entry}
              onClick={() => setSelectedMinifig(minifig)}
            />
          ))}
        </div>
      )}

      <MinifigDetailModal
        minifig={selectedMinifig}
        entry={selectedMinifig ? collection[selectedMinifig.id] : undefined}
        onClose={() => setSelectedMinifig(null)}
        onStatusChange={onStatusChange}
        onUpdateEntry={onUpdateEntry}
        onRemove={onRemove}
      />

      <FoundItModal
        minifigId={foundItMinifigId}
        collection={collection}
        onClose={() => setFoundItMinifigId(null)}
        onStatusChange={onStatusChange}
        onUpdateEntry={onUpdateEntry}
      />
    </div>
  );
}
