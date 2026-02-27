import { Check, Heart, DollarSign, Package, X } from 'lucide-react';
import type { ItemStatus } from '../../types';

interface StatusSelectorProps {
  currentStatus?: ItemStatus;
  onSelect: (status: ItemStatus) => void;
  onRemove: () => void;
  onSoldClick?: () => void;
}

const statuses: Array<{ value: ItemStatus; label: string; icon: typeof Check; color: string; bg: string }> = [
  { value: 'owned', label: 'Owned', icon: Check, color: 'text-sw-green', bg: 'hover:bg-sw-green/20 border-sw-green/30' },
  { value: 'wanted', label: 'Wanted', icon: Heart, color: 'text-sw-blue', bg: 'hover:bg-sw-blue/20 border-sw-blue/30' },
  { value: 'for-sale', label: 'For Sale', icon: DollarSign, color: 'text-sw-orange', bg: 'hover:bg-sw-orange/20 border-sw-orange/30' },
  { value: 'sold', label: 'Sold', icon: Package, color: 'text-sw-purple', bg: 'hover:bg-sw-purple/20 border-sw-purple/30' },
];

export function StatusSelector({ currentStatus, onSelect, onRemove, onSoldClick }: StatusSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map(({ value, label, icon: Icon, color, bg }) => (
        <button
          key={value}
          onClick={() => {
            if (value === 'sold' && onSoldClick) {
              onSoldClick();
            } else {
              onSelect(value);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors cursor-pointer ${
            currentStatus === value
              ? `${color} ${bg.replace('hover:', '')} border-current font-semibold`
              : `text-sw-text-dim border-sw-border ${bg}`
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
      {currentStatus && (
        <button
          onClick={onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-sw-red/30 text-sw-red hover:bg-sw-red/20 transition-colors cursor-pointer"
        >
          <X size={14} />
          Remove
        </button>
      )}
    </div>
  );
}
