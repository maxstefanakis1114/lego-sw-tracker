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
  onAdd: (minifigId: string, quantity: number, forSaleQuantity: number, condition: ItemCondition, pricePaid: number | null) => void;
}

export function AddToCollectionModal({ minifig, onClose, onAdd }: AddToCollectionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [forSaleQty, setForSaleQty] = useState(0);
  const [condition, setCondition] = useState<ItemCondition>('used');
  const [pricePaid, setPricePaid] = useState('');

  if (!minifig) return null;

  const marketPrice = getMarketPrice(minifig.id);
  const keepQty = quantity - forSaleQty;

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, newQty);
    setQuantity(clamped);
    // Clamp forSaleQty so keepQty stays >= 1
    if (forSaleQty > clamped - 1) {
      setForSaleQty(Math.max(0, clamped - 1));
    }
  };

  const handleAdd = () => {
    onAdd(minifig.id, quantity, forSaleQty, condition, pricePaid ? Number(pricePaid) : null);
    // Reset for next use
    setQuantity(1);
    setForSaleQty(0);
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
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-10 h-10 rounded-lg bg-sw-dark border border-sw-border flex items-center justify-center text-sw-text hover:border-sw-gold/50 transition-colors cursor-pointer"
            >
              <Minus size={16} />
            </button>
            <span className="text-2xl font-bold text-sw-text w-12 text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-sw-dark border border-sw-border flex items-center justify-center text-sw-text hover:border-sw-gold/50 transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Split controls */}
        <div className="rounded-lg bg-sw-dark border border-sw-border p-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-sw-green">
              <Package size={14} />
              Keeping
            </span>
            <div className="flex items-center gap-2">
              {quantity > 1 && (
                <>
                  <button
                    onClick={() => setForSaleQty(q => Math.min(quantity - 1, q + 1))}
                    className="w-7 h-7 rounded bg-sw-darker border border-sw-border flex items-center justify-center text-sw-text-dim hover:border-sw-green/50 transition-colors cursor-pointer text-xs"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-sw-text w-6 text-center">{keepQty}</span>
                  <button
                    onClick={() => setForSaleQty(q => Math.max(0, q - 1))}
                    className="w-7 h-7 rounded bg-sw-darker border border-sw-border flex items-center justify-center text-sw-text-dim hover:border-sw-green/50 transition-colors cursor-pointer text-xs"
                  >
                    <Plus size={12} />
                  </button>
                </>
              )}
              {quantity <= 1 && (
                <span className="font-bold text-sw-text">{keepQty}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-sw-orange">
              <DollarSign size={14} />
              For sale
            </span>
            <div className="flex items-center gap-2">
              {quantity > 1 && (
                <>
                  <button
                    onClick={() => setForSaleQty(q => Math.max(0, q - 1))}
                    className="w-7 h-7 rounded bg-sw-darker border border-sw-border flex items-center justify-center text-sw-text-dim hover:border-sw-orange/50 transition-colors cursor-pointer text-xs"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-sw-text w-6 text-center">{forSaleQty}</span>
                  <button
                    onClick={() => setForSaleQty(q => Math.min(quantity - 1, q + 1))}
                    className="w-7 h-7 rounded bg-sw-darker border border-sw-border flex items-center justify-center text-sw-text-dim hover:border-sw-orange/50 transition-colors cursor-pointer text-xs"
                  >
                    <Plus size={12} />
                  </button>
                </>
              )}
              {quantity <= 1 && (
                <span className="font-bold text-sw-text">{forSaleQty}</span>
              )}
            </div>
          </div>
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
