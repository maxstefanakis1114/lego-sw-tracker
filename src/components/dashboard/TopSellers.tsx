import { useMemo } from 'react';
import type { CatalogMinifig } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Trophy } from 'lucide-react';

interface TopSellersProps {
  sellers: Array<{ minifigId: string; name: string; profit: number; count: number }>;
}

export function TopSellers({ sellers }: TopSellersProps) {
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  if (sellers.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-3 flex items-center gap-1.5">
        <Trophy size={14} />
        Top Sellers
      </h3>
      <div className="space-y-2">
        {sellers.slice(0, 5).map((seller, idx) => {
          const m = catalogMap.get(seller.minifigId);
          return (
            <div key={seller.minifigId} className="flex items-center gap-3">
              <span className="text-xs text-sw-text-dim w-4 text-right">{idx + 1}</span>
              <ImageWithFallback
                src={m?.imageUrl ?? ''}
                alt={seller.name}
                className="w-8 h-8 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-sw-text truncate">{seller.name}</div>
                <div className="text-xs text-sw-text-dim">{seller.count} sale{seller.count !== 1 ? 's' : ''}</div>
              </div>
              <span className={`text-sm font-bold ${seller.profit >= 0 ? 'text-sw-green' : 'text-sw-red'}`}>
                {seller.profit >= 0 ? '+' : ''}${seller.profit.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
