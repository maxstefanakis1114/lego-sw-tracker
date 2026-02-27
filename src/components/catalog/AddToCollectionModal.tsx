import { useState } from 'react';
import type { CatalogMinifig, ItemCondition } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { getMarketPrice } from '../../services/priceService';
import { Minus, Plus, Package, DollarSign } from 'lucide-react';

interface AddToCollectionModalProps {
  minifig: CatalogMinifig | null;
  onClose: () => void;
  onAdd: (minifigId: string, quantity: number, condition: ItemCondition, pricePaid: number | null) => void;
}

export function AddToCollectionModal({ minifig, onClose, onAdd }: AddToCollectionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ItemCondition>('used');
  const [pricePaid, setPricePaid] = useState('');

  if (!minifig) return null;

  const marketPrice = getMarketPrice(minifig.id);
  const forSaleQty = Math.max(0, quantity - 1);

  const handleAdd = () => {
    onAdd(minifig.id, quantity, condition, pricePaid ? Number(pricePaid) : null);
    // Reset for next use
    setQuantity(1);
    setCondition('used');
    setPricePaid('');
    onClose();
  };

  return (
    <Modal open={!!minifig} onClose={onClose} title="Add to Collection">
      <div className="space-y-5">
        {/* Minifig preview */}
        <div className="flex items-center gap-4">
          <ImageWithFallback
            src={minifig.imageUrl}
            alt={minifig.name}
            className="w-20 h-20 rounded-lg bg-sw-dark"
          />
          <div>
            <p className="text-sw-text font-semibold">{minifig.name}</p>
            <p className="text-sw-text-dim text-sm font-mono">{minifig.id}</p>
            {marketPrice !== null && (
              <p className="text-sw-green text-sm mt-1">Market: ${marketPrice.toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Quantity picker */}
        <div>
          <label className="text-xs text-sw-text-dim mb-2 block">How many do you have?</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg bg-sw-dark border border-sw-border flex items-center justify-center text-sw-text hover:border-sw-gold/50 transition-colors cursor-pointer"
            >
              <Minus size={16} />
            </button>
            <span className="text-2xl font-bold text-sw-text w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-lg bg-sw-dark border border-sw-border flex items-center justify-center text-sw-text hover:border-sw-gold/50 transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Split display */}
        <div className="rounded-lg bg-sw-dark border border-sw-border p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-sw-green">
              <Package size={14} />
              Your collection
            </span>
            <span className="font-bold text-sw-text">1</span>
          </div>
          {forSaleQty > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-sw-orange">
                <DollarSign size={14} />
                Listed for sale
              </span>
              <span className="font-bold text-sw-text">{forSaleQty}</span>
            </div>
          )}
        </div>

        {/* Condition & Price */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Condition"
            value={condition}
            onChange={e => setCondition(e.target.value as ItemCondition)}
            options={[
              { value: 'new', label: 'New / Sealed' },
              { value: 'used', label: 'Used' },
              { value: 'damaged', label: 'Damaged' },
            ]}
          />
          <Input
            label="Price Paid ($)"
            type="number"
            min={0}
            step={0.01}
            value={pricePaid}
            onChange={e => setPricePaid(e.target.value)}
            placeholder="per unit"
          />
        </div>

        {/* Add button */}
        <Button onClick={handleAdd} className="w-full">
          Add {quantity} to Collection
        </Button>
      </div>
    </Modal>
  );
}
