import { useMemo } from 'react';
import type { CollectionEntry, CatalogMinifig } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { AlertCircle } from 'lucide-react';

interface ActionNeededProps {
  collection: Record<string, CollectionEntry>;
}

interface ActionItem {
  type: 'no-price' | 'no-sku' | 'no-asking';
  minifigId: string;
  name: string;
}

export function ActionNeeded({ collection }: ActionNeededProps) {
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const actions = useMemo(() => {
    const items: ActionItem[] = [];
    for (const entry of Object.values(collection)) {
      const m = catalogMap.get(entry.minifigId);
      if (!m) continue;
      if ((entry.status === 'owned' || entry.status === 'for-sale') && entry.pricePaid === null) {
        items.push({ type: 'no-price', minifigId: entry.minifigId, name: m.name });
      }
      if (entry.status === 'for-sale' && !entry.sku) {
        items.push({ type: 'no-sku', minifigId: entry.minifigId, name: m.name });
      }
      if (entry.status === 'for-sale' && entry.askingPrice === null) {
        items.push({ type: 'no-asking', minifigId: entry.minifigId, name: m.name });
      }
    }
    return items.slice(0, 10);
  }, [collection, catalogMap]);

  if (actions.length === 0) return null;

  const typeLabel: Record<ActionItem['type'], string> = {
    'no-price': 'Missing cost',
    'no-sku': 'Missing SKU',
    'no-asking': 'Missing price',
  };

  const typeColor: Record<ActionItem['type'], string> = {
    'no-price': 'text-sw-orange',
    'no-sku': 'text-sw-blue',
    'no-asking': 'text-sw-red',
  };

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-3 flex items-center gap-1.5">
        <AlertCircle size={14} />
        Action Needed ({actions.length})
      </h3>
      <div className="space-y-1.5">
        {actions.map((item, idx) => (
          <div key={`${item.minifigId}-${item.type}-${idx}`} className="flex items-center justify-between text-sm">
            <span className="text-sw-text truncate max-w-[200px]">{item.name}</span>
            <span className={`text-xs ${typeColor[item.type]}`}>{typeLabel[item.type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
