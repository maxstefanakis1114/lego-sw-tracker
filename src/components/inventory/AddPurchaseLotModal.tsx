import { useState } from 'react';
import type { PurchaseLotItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LotItemSelector } from './LotItemSelector';
import { CostAllocationView } from './CostAllocationView';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

type Step = 'details' | 'items' | 'costs' | 'confirm';

interface AddPurchaseLotModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lot: {
    name: string;
    source: string;
    totalCost: number;
    items: PurchaseLotItem[];
    notes: string;
  }) => void;
}

export function AddPurchaseLotModal({ open, onClose, onSave }: AddPurchaseLotModalProps) {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseLotItem[]>([]);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'market' | 'manual'>('equal');

  const resetAndClose = () => {
    setStep('details');
    setName('');
    setSource('');
    setTotalCost(0);
    setNotes('');
    setItems([]);
    setSplitMethod('equal');
    onClose();
  };

  const handleSave = () => {
    onSave({ name, source, totalCost, items, notes });
    resetAndClose();
  };

  const steps: Step[] = ['details', 'items', 'costs', 'confirm'];
  const stepIdx = steps.indexOf(step);

  const canNext = () => {
    if (step === 'details') return name.trim() && totalCost > 0;
    if (step === 'items') return items.length > 0;
    if (step === 'costs') {
      const allocated = items.reduce((s, i) => s + i.allocatedCost, 0);
      return Math.abs(totalCost - allocated) < 0.01;
    }
    return true;
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Add Purchase Lot">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-sw-text-dim">
          {steps.map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight size={12} />}
              <span className={step === s ? 'text-sw-gold font-semibold' : idx < stepIdx ? 'text-sw-green' : ''}>
                {idx + 1}. {s === 'details' ? 'Details' : s === 'items' ? 'Select Items' : s === 'costs' ? 'Allocate Costs' : 'Confirm'}
              </span>
            </div>
          ))}
        </div>

        {step === 'details' && (
          <div className="space-y-3">
            <Input
              label="Lot Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "eBay Lot - Jan 2025"'
            />
            <Input
              label="Source"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. eBay, Facebook Marketplace, etc."
            />
            <Input
              label="Total Cost ($)"
              type="number"
              min={0}
              step={0.01}
              value={totalCost || ''}
              onChange={e => setTotalCost(Number(e.target.value) || 0)}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-sw-text-dim">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this lot..."
                rows={2}
                className="bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {step === 'items' && (
          <LotItemSelector selectedItems={items} onItemsChange={setItems} />
        )}

        {step === 'costs' && (
          <CostAllocationView
            totalCost={totalCost}
            items={items}
            onItemsChange={setItems}
            splitMethod={splitMethod}
            onSplitMethodChange={setSplitMethod}
          />
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="glass rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sw-text-dim">Lot Name</span>
                <span className="text-sw-text font-semibold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sw-text-dim">Source</span>
                <span className="text-sw-text">{source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sw-text-dim">Total Cost</span>
                <span className="text-sw-gold font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sw-text-dim">Items</span>
                <span className="text-sw-text">{items.length} minifigs</span>
              </div>
            </div>
            <div className="text-xs text-sw-text-dim">
              Items will be added to your collection as "Owned" with the allocated cost as price paid.
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-2 border-t border-sw-border">
          {stepIdx > 0 ? (
            <Button variant="secondary" onClick={() => setStep(steps[stepIdx - 1])}>
              <ChevronLeft size={16} />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step === 'confirm' ? (
            <Button onClick={handleSave}>
              <Check size={16} />
              Create Lot
            </Button>
          ) : (
            <Button onClick={() => setStep(steps[stepIdx + 1])} disabled={!canNext()}>
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
