import { useState, useMemo } from 'react';
import type { CatalogMinifig, PurchaseLotItem } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { getMarketPrice } from '../../services/priceService';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Search, Plus, X } from 'lucide-react';

interface LotItemSelectorProps {
  selectedItems: PurchaseLotItem[];
  onItemsChange: (items: PurchaseLotItem[]) => void;
}

export function LotItemSelector({ selectedItems, onItemsChange }: LotItemSelectorProps) {
  const [search, setSearch] = useState('');

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    const selectedIds = new Set(selectedItems.map(i => i.minifigId));
    return getCatalog()
      .filter(m =>
        !selectedIds.has(m.id) &&
        (m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [search, selectedItems]);

  const addItem = (minifigId: string) => {
    onItemsChange([...selectedItems, { minifigId, allocatedCost: 0 }]);
    setSearch('');
  };

  const removeItem = (minifigId: string) => {
    onItemsChange(selectedItems.filter(i => i.minifigId !== minifigId));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text-dim" size={16} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search minifigs to add..."
          className="w-full bg-sw-dark border border-sw-border rounded-lg pl-9 pr-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="border border-sw-border rounded-lg divide-y divide-sw-border max-h-48 overflow-y-auto">
          {searchResults.map(m => (
            <button
              key={m.id}
              onClick={() => addItem(m.id)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-sw-border/30 transition-colors text-left cursor-pointer"
            >
              <ImageWithFallback src={m.imageUrl} alt={m.name} className="w-8 h-8 rounded" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-sw-text truncate">{m.name}</div>
                <div className="text-xs text-sw-text-dim">{m.id} &middot; {m.year}</div>
              </div>
              <Plus size={16} className="text-sw-green shrink-0" />
            </button>
          ))}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-sw-text-dim font-semibold">
            Selected ({selectedItems.length})
          </div>
          <div className="border border-sw-border rounded-lg divide-y divide-sw-border">
            {selectedItems.map(item => {
              const m = catalogMap.get(item.minifigId);
              const mkt = getMarketPrice(item.minifigId);
              return (
                <div key={item.minifigId} className="flex items-center gap-3 px-3 py-2">
                  <ImageWithFallback
                    src={m?.imageUrl ?? ''}
                    alt={m?.name ?? item.minifigId}
                    className="w-8 h-8 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-sw-text truncate">{m?.name ?? item.minifigId}</div>
                    <div className="text-xs text-sw-text-dim">
                      {m?.id} {mkt !== null && `· Mkt $${mkt.toFixed(2)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.minifigId)}
                    className="p-1 rounded hover:bg-sw-red/20 text-sw-text-dim hover:text-sw-red transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
