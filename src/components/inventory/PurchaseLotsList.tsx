import { useState, useMemo } from 'react';
import type { PurchaseLot, CatalogMinifig } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { ChevronDown, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';

interface PurchaseLotsListProps {
  lots: PurchaseLot[];
  onDeleteLot: (id: string) => void;
}

export function PurchaseLotsList({ lots, onDeleteLot }: PurchaseLotsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  if (lots.length === 0) {
    return (
      <div className="text-center py-12 text-sw-text-dim">
        <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
        <p>No purchase lots yet</p>
        <p className="text-sm mt-1">Create your first lot to start tracking costs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lots.map(lot => {
        const expanded = expandedId === lot.id;
        return (
          <div key={lot.id} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expanded ? null : lot.id)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-sw-border/20 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronDown size={16} className="text-sw-text-dim" /> : <ChevronRight size={16} className="text-sw-text-dim" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-sw-text">{lot.name}</div>
                <div className="text-xs text-sw-text-dim">
                  {lot.source} &middot; {lot.items.length} items &middot; {new Date(lot.dateCreated).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm font-bold text-sw-gold">${lot.totalCost.toFixed(2)}</div>
            </button>

            {expanded && (
              <div className="border-t border-sw-border">
                <div className="divide-y divide-sw-border">
                  {lot.items.map(item => {
                    const m = catalogMap.get(item.minifigId);
                    return (
                      <div key={item.minifigId} className="flex items-center gap-3 px-4 py-2 pl-10">
                        <ImageWithFallback
                          src={m?.imageUrl ?? ''}
                          alt={m?.name ?? item.minifigId}
                          className="w-8 h-8 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-sw-text truncate">{m?.name ?? item.minifigId}</div>
                          <div className="text-xs text-sw-text-dim">{item.minifigId}</div>
                        </div>
                        <div className="text-sm text-sw-text">${item.allocatedCost.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                {lot.notes && (
                  <div className="px-4 py-2 pl-10 text-xs text-sw-text-dim border-t border-sw-border">
                    {lot.notes}
                  </div>
                )}
                <div className="px-4 py-2 border-t border-sw-border flex justify-end">
                  <button
                    onClick={() => onDeleteLot(lot.id)}
                    className="flex items-center gap-1 text-xs text-sw-red hover:text-sw-red/80 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Delete Lot
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
