import { useState, useEffect, useMemo } from 'react';
import type { CollectionEntry, SalePlatform, ItemStatus } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { getMarketPrice } from '../../services/priceService';
import { getPlatformFee, calculateNetProfit } from '../../services/financialService';
import { useSales } from '../../hooks/useSales';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ProfitCalculator } from './ProfitCalculator';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Check } from 'lucide-react';

interface RecordSaleModalProps {
  minifigId: string | null;
  collection: Record<string, CollectionEntry>;
  onClose: () => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onStatusChange: (minifigId: string, status: ItemStatus) => void;
}

export function RecordSaleModal({
  minifigId,
  collection,
  onClose,
  onUpdateEntry,
  onStatusChange,
}: RecordSaleModalProps) {
  const { addSale } = useSales();

  const catalogMap = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl: string }>();
    for (const m of getCatalog()) map.set(m.id, { name: m.name, imageUrl: m.imageUrl });
    return map;
  }, []);

  const entry = minifigId ? collection[minifigId] : undefined;
  const minifig = minifigId ? catalogMap.get(minifigId) : undefined;
  const marketPrice = minifigId ? getMarketPrice(minifigId) : null;

  const [salePrice, setSalePrice] = useState(0);
  const [platform, setPlatform] = useState<SalePlatform>('whatnot');
  const [platformFee, setPlatformFee] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCharged, setShippingCharged] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Initialize sale price from asking price or market price
  useEffect(() => {
    if (entry) {
      const price = entry.askingPrice ?? marketPrice ?? 0;
      setSalePrice(price);
    }
  }, [entry, marketPrice]);

  // Auto-calc platform fee when price or platform changes
  useEffect(() => {
    setPlatformFee(getPlatformFee(salePrice, platform));
  }, [salePrice, platform]);

  const costBasis = entry?.pricePaid ?? 0;
  const netProfit = calculateNetProfit(salePrice, platformFee, costBasis, shippingCost, shippingCharged);

  const handleSave = () => {
    if (!minifigId) return;

    addSale({
      minifigId,
      salePrice,
      platform,
      platformFee,
      shippingCost,
      shippingCharged,
      costBasis,
      netProfit,
      date,
      notes,
    });

    onUpdateEntry(minifigId, { priceSold: salePrice });
    onStatusChange(minifigId, 'sold');
    onClose();
  };

  if (!minifigId) return null;

  return (
    <Modal open={!!minifigId} onClose={onClose} title="Record Sale">
      <div className="space-y-4">
        {/* Item being sold */}
        {minifig && (
          <div className="flex items-center gap-3 p-3 glass rounded-lg">
            <ImageWithFallback
              src={entry?.customImageUrl || minifig.imageUrl}
              alt={minifig.name}
              className="w-12 h-12 rounded"
            />
            <div>
              <div className="text-sm font-semibold text-sw-text">{minifig.name}</div>
              <div className="text-xs text-sw-text-dim">
                {minifigId} &middot; Cost basis: {costBasis > 0 ? `$${costBasis.toFixed(2)}` : 'Unknown'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sale Price ($)"
            type="number"
            min={0}
            step={0.01}
            value={salePrice || ''}
            onChange={e => setSalePrice(Number(e.target.value) || 0)}
          />
          <Select
            label="Platform"
            value={platform}
            onChange={e => setPlatform(e.target.value as SalePlatform)}
            options={[
              { value: 'whatnot', label: 'Whatnot (9.5%)' },
              { value: 'ebay', label: 'eBay (13.25%)' },
              { value: 'bricklink', label: 'BrickLink (3%)' },
              { value: 'mercari', label: 'Mercari (10%)' },
              { value: 'other', label: 'Other (0%)' },
            ]}
          />
          <Input
            label="Platform Fee ($)"
            type="number"
            min={0}
            step={0.01}
            value={platformFee || ''}
            onChange={e => setPlatformFee(Number(e.target.value) || 0)}
          />
          <Input
            label="Sale Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <Input
            label="Shipping Cost ($)"
            type="number"
            min={0}
            step={0.01}
            value={shippingCost || ''}
            onChange={e => setShippingCost(Number(e.target.value) || 0)}
          />
          <Input
            label="Shipping Charged ($)"
            type="number"
            min={0}
            step={0.01}
            value={shippingCharged || ''}
            onChange={e => setShippingCharged(Number(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sw-text-dim">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about this sale..."
            rows={2}
            className="bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors resize-none"
          />
        </div>

        <ProfitCalculator
          salePrice={salePrice}
          platformFee={platformFee}
          costBasis={costBasis}
          shippingCost={shippingCost}
          shippingCharged={shippingCharged}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-sw-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={salePrice <= 0}>
            <Check size={16} />
            Record Sale
          </Button>
        </div>
      </div>
    </Modal>
  );
}
