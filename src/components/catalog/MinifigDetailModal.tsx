import type { CatalogMinifig, CollectionEntry, ItemCondition, WantPriority } from '../../types';
import { Modal } from '../ui/Modal';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { StatusSelector } from '../collection/StatusSelector';
import { PhotoManager } from '../export/PhotoManager';
import { ProfitCalculator } from '../sales/ProfitCalculator';
import { Package, TrendingUp } from 'lucide-react';
import { getPrice, getMarketPrice, getBricklinkId } from '../../services/priceService';
import { useSales } from '../../hooks/useSales';

interface MinifigDetailModalProps {
  minifig: CatalogMinifig | null;
  entry?: CollectionEntry;
  onClose: () => void;
  onStatusChange: (minifigId: string, status: CollectionEntry['status']) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onRemove: (minifigId: string) => void;
}

export function MinifigDetailModal({
  minifig,
  entry,
  onClose,
  onStatusChange,
  onUpdateEntry,
  onRemove,
}: MinifigDetailModalProps) {
  const { getSalesForMinifig } = useSales();

  if (!minifig) return null;

  const priceData = getPrice(minifig.id);
  const marketPrice = getMarketPrice(minifig.id);
  const bricklinkId = getBricklinkId(minifig.id);
  const sales = entry?.status === 'sold' ? getSalesForMinifig(minifig.id) : [];
  const lastSale = sales.length > 0 ? sales[0] : null;

  const handleUseMarketPrice = () => {
    if (marketPrice !== null) {
      if (entry?.status === 'sold') {
        onUpdateEntry(minifig.id, { priceSold: marketPrice });
      } else {
        onUpdateEntry(minifig.id, { askingPrice: marketPrice });
      }
    }
  };

  return (
    <Modal open={!!minifig} onClose={onClose} title={minifig.name}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 shrink-0">
          <ImageWithFallback
            src={entry?.customImageUrl || minifig.imageUrl}
            alt={minifig.name}
            className="w-full aspect-square rounded-lg bg-sw-dark"
          />
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-sw-text-dim">ID</span>
              <span className="font-mono text-sw-text">{minifig.id}</span>
            </div>
            {bricklinkId && (
              <div className="flex justify-between">
                <span className="text-sw-text-dim">BrickLink</span>
                <span className="font-mono text-sw-text">{bricklinkId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sw-text-dim">Year</span>
              <span className="text-sw-text">{minifig.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sw-text-dim">Faction</span>
              <span className="text-sw-text">{minifig.faction}</span>
            </div>
          </div>

          {priceData && (
            <div className="mt-3 p-2.5 rounded-lg bg-sw-dark border border-sw-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sw-text-dim mb-2">
                <TrendingUp size={12} />
                Market Value
              </div>
              {priceData.valueUsed !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-sw-text-dim">Used</span>
                  <span className="text-sw-green font-bold">${priceData.valueUsed.toFixed(2)}</span>
                </div>
              )}
              {priceData.valueNew !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-sw-text-dim">New</span>
                  <span className="text-sw-gold font-bold">${priceData.valueNew.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-sw-text-dim mb-2">Status</h3>
            <StatusSelector
              currentStatus={entry?.status}
              onSelect={status => onStatusChange(minifig.id, status)}
              onRemove={() => onRemove(minifig.id)}
            />
          </div>

          {entry && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total Quantity"
                  type="number"
                  min={1}
                  value={entry.quantity}
                  onChange={e => {
                    const newQty = Math.max(1, Number(e.target.value));
                    const newForSale = Math.max(0, Math.min(entry.forSaleQuantity ?? 0, newQty - 1));
                    onUpdateEntry(minifig.id, { quantity: newQty, forSaleQuantity: newForSale });
                  }}
                />
                <Select
                  label="Condition"
                  value={entry.condition}
                  onChange={e => onUpdateEntry(minifig.id, { condition: e.target.value as ItemCondition })}
                  options={[
                    { value: 'new', label: 'New / Sealed' },
                    { value: 'used', label: 'Used' },
                    { value: 'damaged', label: 'Damaged' },
                  ]}
                />
                {entry.quantity > 1 && (
                  <Input
                    label="For Sale"
                    type="number"
                    min={0}
                    max={entry.quantity - 1}
                    value={entry.forSaleQuantity ?? 0}
                    onChange={e => onUpdateEntry(minifig.id, {
                      forSaleQuantity: Math.max(0, Math.min(entry.quantity - 1, Number(e.target.value))),
                    })}
                  />
                )}
                <Input
                  label="Price Paid ($)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={entry.pricePaid ?? ''}
                  onChange={e => onUpdateEntry(minifig.id, { pricePaid: e.target.value ? Number(e.target.value) : null })}
                />
                {(entry.status === 'for-sale' || entry.status === 'sold') && (
                  <div>
                    <Input
                      label={entry.status === 'sold' ? 'Price Sold ($)' : 'Asking Price ($)'}
                      type="number"
                      min={0}
                      step={0.01}
                      value={entry.status === 'sold' ? (entry.priceSold ?? '') : (entry.askingPrice ?? '')}
                      onChange={e => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        if (entry.status === 'sold') {
                          onUpdateEntry(minifig.id, { priceSold: val });
                        } else {
                          onUpdateEntry(minifig.id, { askingPrice: val });
                        }
                      }}
                    />
                    {marketPrice !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUseMarketPrice}
                        className="mt-1 text-xs"
                      >
                        Use market price (${marketPrice.toFixed(2)})
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Priority and target price for wanted items */}
              {entry.status === 'wanted' && (
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Priority"
                    value={entry.wantPriority ?? ''}
                    onChange={e => onUpdateEntry(minifig.id, {
                      wantPriority: (e.target.value || undefined) as WantPriority | undefined,
                    })}
                    options={[
                      { value: '', label: 'No priority' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />
                  <Input
                    label="Target Price ($)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={entry.targetPrice ?? ''}
                    onChange={e => onUpdateEntry(minifig.id, {
                      targetPrice: e.target.value ? Number(e.target.value) : null,
                    })}
                  />
                </div>
              )}

              {/* Storage location */}
              <Input
                label="Storage Location"
                value={entry.storageLocation ?? ''}
                onChange={e => onUpdateEntry(minifig.id, { storageLocation: e.target.value || undefined })}
                placeholder="e.g. Box A, Shelf 3..."
              />

              <Input
                label="SKU"
                value={entry.sku}
                onChange={e => onUpdateEntry(minifig.id, { sku: e.target.value })}
                placeholder="Custom SKU for export"
              />

              <Input
                label="Custom Image URL"
                value={entry.customImageUrl}
                onChange={e => onUpdateEntry(minifig.id, { customImageUrl: e.target.value })}
                placeholder="https://..."
              />

              {/* Photo manager for additional photos */}
              <PhotoManager entry={entry} onUpdateEntry={onUpdateEntry} />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-sw-text-dim">Notes</label>
                <textarea
                  value={entry.notes}
                  onChange={e => onUpdateEntry(minifig.id, { notes: e.target.value })}
                  placeholder="Any notes about this minifig..."
                  rows={3}
                  className="bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors resize-none"
                />
              </div>

              {/* Profit breakdown for sold items */}
              {entry.status === 'sold' && lastSale && (
                <ProfitCalculator
                  salePrice={lastSale.salePrice}
                  platformFee={lastSale.platformFee}
                  costBasis={lastSale.costBasis}
                  shippingCost={lastSale.shippingCost}
                  shippingCharged={lastSale.shippingCharged}
                />
              )}
            </>
          )}

          {minifig.sets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-sw-text-dim mb-2 flex items-center gap-1.5">
                <Package size={14} />
                Appears in {minifig.sets.length} set{minifig.sets.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {minifig.sets.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-sw-border/30">
                    <span className="text-sw-text">{s.name}</span>
                    <span className="text-sw-text-dim text-xs font-mono">{s.id} ({s.year})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry && (
            <div className="text-xs text-sw-text-dim pt-2 border-t border-sw-border">
              Added: {new Date(entry.dateAdded).toLocaleDateString()} &middot; Modified: {new Date(entry.dateModified).toLocaleDateString()}
              {entry.purchaseLotId && <span> &middot; Lot: {entry.purchaseLotId.slice(0, 8)}...</span>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
