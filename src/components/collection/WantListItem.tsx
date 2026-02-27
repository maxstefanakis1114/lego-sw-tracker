import type { WantListItem as WantListItemType } from '../../hooks/useWantList';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Zap, ArrowDown } from 'lucide-react';

interface WantListItemProps {
  item: WantListItemType;
  onClick: () => void;
  onFoundIt: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-sw-red/20 text-sw-red border-sw-red/30',
  medium: 'bg-sw-orange/20 text-sw-orange border-sw-orange/30',
  low: 'bg-sw-blue/20 text-sw-blue border-sw-blue/30',
};

export function WantListItem({ item, onClick, onFoundIt }: WantListItemProps) {
  const { entry, minifig, marketPrice, isDeal } = item;

  return (
    <div
      className={`glass rounded-xl p-3 cursor-pointer hover:border-sw-gold/30 transition-colors relative ${
        isDeal ? 'ring-1 ring-sw-green/50' : ''
      }`}
      onClick={onClick}
    >
      {isDeal && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-sw-green/20 rounded text-[10px] text-sw-green font-semibold">
          <ArrowDown size={10} />
          Deal
        </div>
      )}

      <div className="flex items-start gap-3">
        <ImageWithFallback
          src={entry.customImageUrl || minifig.imageUrl}
          alt={minifig.name}
          className="w-14 h-14 rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-sw-text truncate">{minifig.name}</div>
          <div className="text-xs text-sw-text-dim">{minifig.id} &middot; {minifig.year}</div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {entry.wantPriority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[entry.wantPriority]}`}>
                {entry.wantPriority}
              </span>
            )}
            {marketPrice !== null && (
              <span className="text-xs text-sw-gold">Mkt ${marketPrice.toFixed(2)}</span>
            )}
            {entry.targetPrice != null && (
              <span className="text-xs text-sw-text-dim">
                Target ${entry.targetPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onFoundIt(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-sw-green/30 text-sw-green hover:bg-sw-green/20 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Zap size={12} />
          Found It!
        </button>
      </div>
    </div>
  );
}
