import { DollarSign, Package } from 'lucide-react';
import type { ItemStatus } from '../../types';

interface QuickStatusButtonsProps {
  currentStatus: ItemStatus;
  onStatusChange: (status: ItemStatus) => void;
  onRecordSale?: () => void;
}

export function QuickStatusButtons({ currentStatus, onStatusChange, onRecordSale }: QuickStatusButtonsProps) {
  return (
    <div className="flex gap-1">
      {currentStatus === 'owned' && (
        <button
          onClick={() => onStatusChange('for-sale')}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-sw-orange/30 text-sw-orange hover:bg-sw-orange/20 transition-colors cursor-pointer"
        >
          <DollarSign size={12} />
          List
        </button>
      )}
      {(currentStatus === 'owned' || currentStatus === 'for-sale') && (
        <button
          onClick={() => onRecordSale ? onRecordSale() : onStatusChange('sold')}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-sw-purple/30 text-sw-purple hover:bg-sw-purple/20 transition-colors cursor-pointer"
        >
          <Package size={12} />
          Sold
        </button>
      )}
    </div>
  );
}
