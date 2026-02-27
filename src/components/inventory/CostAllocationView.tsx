import { useMemo } from 'react';
import type { CatalogMinifig, PurchaseLotItem } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { getMarketPrice } from '../../services/priceService';
import { splitCostEqual, splitCostByMarketValue } from '../../services/financialService';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Button } from '../ui/Button';

type SplitMethod = 'equal' | 'market' | 'manual';

interface CostAllocationViewProps {
  totalCost: number;
  items: PurchaseLotItem[];
  onItemsChange: (items: PurchaseLotItem[]) => void;
  splitMethod: SplitMethod;
  onSplitMethodChange: (method: SplitMethod) => void;
}

export function CostAllocationView({
  totalCost,
  items,
  onItemsChange,
  splitMethod,
  onSplitMethodChange,
}: CostAllocationViewProps) {
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const allocatedTotal = items.reduce((s, i) => s + i.allocatedCost, 0);
  const diff = Math.round((totalCost - allocatedTotal) * 100) / 100;

  const applySplit = (method: SplitMethod) => {
    onSplitMethodChange(method);
    let costs: number[];
    if (method === 'equal') {
      costs = splitCostEqual(totalCost, items.length);
    } else if (method === 'market') {
      const marketValues = items.map(i => getMarketPrice(i.minifigId));
      costs = splitCostByMarketValue(totalCost, marketValues);
    } else {
      return; // manual — don't auto-assign
    }
    onItemsChange(items.map((item, idx) => ({ ...item, allocatedCost: costs[idx] })));
  };

  const updateItemCost = (minifigId: string, cost: number) => {
    onSplitMethodChange('manual');
    onItemsChange(items.map(i =>
      i.minifigId === minifigId ? { ...i, allocatedCost: cost } : i
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-sw-text-dim font-semibold">Split method:</span>
        {(['equal', 'market', 'manual'] as SplitMethod[]).map(method => (
          <Button
            key={method}
            variant={splitMethod === method ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => applySplit(method)}
          >
            {method === 'equal' ? 'Equal' : method === 'market' ? 'By Market Value' : 'Manual'}
          </Button>
        ))}
      </div>

      <div className="border border-sw-border rounded-lg divide-y divide-sw-border">
        {items.map(item => {
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
                  {mkt !== null && `Mkt $${mkt.toFixed(2)}`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-sw-text-dim">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.allocatedCost || ''}
                  onChange={e => updateItemCost(item.minifigId, Number(e.target.value) || 0)}
                  className="w-20 bg-sw-dark border border-sw-border rounded px-2 py-1 text-sm text-sw-text text-right focus:outline-none focus:border-sw-gold/50"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={`flex justify-between text-sm font-semibold px-1 ${
        Math.abs(diff) < 0.01 ? 'text-sw-green' : 'text-sw-red'
      }`}>
        <span>Total Allocated: ${allocatedTotal.toFixed(2)}</span>
        <span>
          {Math.abs(diff) < 0.01
            ? 'Balanced'
            : `${diff > 0 ? '$' + diff.toFixed(2) + ' remaining' : '-$' + Math.abs(diff).toFixed(2) + ' over'}`
          }
        </span>
      </div>
    </div>
  );
}
