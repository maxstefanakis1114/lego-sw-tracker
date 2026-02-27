import { useState } from 'react';
import type { CollectionEntry } from '../../types';
import { applyMarkupAndRound } from '../../services/financialService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calculator, Check } from 'lucide-react';

interface BatchPricingToolsProps {
  collection: Record<string, CollectionEntry>;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
}

export function BatchPricingTools({ collection, onUpdateEntry }: BatchPricingToolsProps) {
  const [markupPercent, setMarkupPercent] = useState(30);
  const [doRound, setDoRound] = useState(true);
  const [preview, setPreview] = useState<Array<{ minifigId: string; oldPrice: number | null; newPrice: number }>>([]);
  const [applied, setApplied] = useState(false);

  const forSaleItems = Object.values(collection).filter(e => e.status === 'for-sale' && e.pricePaid !== null);

  const generatePreview = () => {
    setApplied(false);
    const items = forSaleItems.map(e => ({
      minifigId: e.minifigId,
      oldPrice: e.askingPrice,
      newPrice: applyMarkupAndRound(e.pricePaid!, markupPercent, doRound),
    }));
    setPreview(items);
  };

  const applyPrices = () => {
    for (const item of preview) {
      onUpdateEntry(item.minifigId, { askingPrice: item.newPrice });
    }
    setApplied(true);
    setPreview([]);
  };

  if (forSaleItems.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-sw-text-dim flex items-center gap-1.5">
        <Calculator size={14} />
        Batch Pricing ({forSaleItems.length} items with cost data)
      </h3>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Markup %"
          type="number"
          min={0}
          step={5}
          value={markupPercent}
          onChange={e => { setMarkupPercent(Number(e.target.value) || 0); setApplied(false); }}
          className="w-24"
        />
        <label className="flex items-center gap-2 text-sm text-sw-text cursor-pointer pb-2">
          <input
            type="checkbox"
            checked={doRound}
            onChange={e => { setDoRound(e.target.checked); setApplied(false); }}
            className="accent-sw-gold"
          />
          Round to .99
        </label>
        <Button variant="secondary" onClick={generatePreview}>Preview Prices</Button>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <div className="border border-sw-border rounded-lg max-h-40 overflow-y-auto divide-y divide-sw-border text-sm">
            {preview.map(item => (
              <div key={item.minifigId} className="flex justify-between px-3 py-1.5">
                <span className="text-sw-text-dim font-mono text-xs">{item.minifigId}</span>
                <span>
                  <span className="text-sw-text-dim line-through mr-2">
                    {item.oldPrice !== null ? `$${item.oldPrice.toFixed(2)}` : '—'}
                  </span>
                  <span className="text-sw-gold font-semibold">${item.newPrice.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>
          <Button onClick={applyPrices}>
            <Check size={16} />
            Apply to All ({preview.length} items)
          </Button>
        </div>
      )}

      {applied && (
        <div className="text-sm text-sw-green">Prices updated successfully!</div>
      )}
    </div>
  );
}
