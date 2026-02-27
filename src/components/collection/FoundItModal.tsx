import { useState, useMemo } from 'react';
import type { CollectionEntry, ItemCondition } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Check } from 'lucide-react';

interface FoundItModalProps {
  minifigId: string | null;
  collection: Record<string, CollectionEntry>;
  onClose: () => void;
  onStatusChange: (minifigId: string, status: CollectionEntry['status']) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
}

export function FoundItModal({
  minifigId,
  collection,
  onClose,
  onStatusChange,
  onUpdateEntry,
}: FoundItModalProps) {
  const [pricePaid, setPricePaid] = useState<number>(0);
  const [source, setSource] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('used');
  const [storageLocation, setStorageLocation] = useState('');

  const catalogMap = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl: string }>();
    for (const m of getCatalog()) map.set(m.id, { name: m.name, imageUrl: m.imageUrl });
    return map;
  }, []);

  const entry = minifigId ? collection[minifigId] : undefined;
  const minifig = minifigId ? catalogMap.get(minifigId) : undefined;

  const handleSave = () => {
    if (!minifigId) return;
    onStatusChange(minifigId, 'owned');
    onUpdateEntry(minifigId, {
      pricePaid: pricePaid || null,
      condition,
      storageLocation: storageLocation || undefined,
      notes: source ? `Source: ${source}${entry?.notes ? '\n' + entry.notes : ''}` : entry?.notes ?? '',
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setPricePaid(0);
    setSource('');
    setCondition('used');
    setStorageLocation('');
    onClose();
  };

  if (!minifigId) return null;

  return (
    <Modal open={!!minifigId} onClose={resetAndClose} title="Found It!">
      <div className="space-y-4">
        {minifig && (
          <div className="flex items-center gap-3 p-3 glass rounded-lg">
            <ImageWithFallback
              src={entry?.customImageUrl || minifig.imageUrl}
              alt={minifig.name}
              className="w-12 h-12 rounded"
            />
            <div>
              <div className="text-sm font-semibold text-sw-text">{minifig.name}</div>
              <div className="text-xs text-sw-text-dim">{minifigId}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price Paid ($)"
            type="number"
            min={0}
            step={0.01}
            value={pricePaid || ''}
            onChange={e => setPricePaid(Number(e.target.value) || 0)}
          />
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
        </div>

        <Input
          label="Source"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="e.g. eBay, Bricklink, yard sale..."
        />

        <Input
          label="Storage Location"
          value={storageLocation}
          onChange={e => setStorageLocation(e.target.value)}
          placeholder="e.g. Box A, Shelf 3..."
        />

        <div className="text-xs text-sw-text-dim">
          This will move the item from your want list to your collection as "Owned".
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-sw-border">
          <Button variant="secondary" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Check size={16} />
            Add to Collection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
