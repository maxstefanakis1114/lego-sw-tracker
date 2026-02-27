import type { CatalogMinifig, CollectionEntry } from '../../types';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { StatusDot } from '../ui/Badge';
import { getMarketPrice } from '../../services/priceService';
import { factionGlowClass } from '../../services/factionColors';

interface MinifigCardProps {
  minifig: CatalogMinifig;
  entry?: CollectionEntry;
  onClick: () => void;
}

export function MinifigCard({ minifig, entry, onClick }: MinifigCardProps) {
  const marketPrice = getMarketPrice(minifig.id);

  return (
    <button
      onClick={onClick}
      className={`glass rounded-xl overflow-hidden text-left transition-all group cursor-pointer flex flex-col relative card-hover-glow card-faction-accent ${factionGlowClass(minifig.faction)}`}
    >
      <div className="relative aspect-square bg-sw-dark p-2">
        <ImageWithFallback
          src={minifig.imageUrl}
          alt={minifig.name}
          className="w-full h-full"
        />
        {entry && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {entry.quantity > 1 && (
              <span className="bg-black/80 text-sw-gold text-xs font-bold px-1.5 py-0.5 rounded">
                x{entry.quantity}
              </span>
            )}
            <StatusDot status={entry.status} />
          </div>
        )}
        {marketPrice !== null && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-sw-green text-xs font-bold px-1.5 py-0.5 rounded">
            ${marketPrice.toFixed(0)}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-medium text-sw-text leading-snug line-clamp-2 group-hover:text-sw-gold transition-colors">
          {minifig.name}
        </p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-sw-text-dim font-mono">{minifig.id}</span>
          <span className="text-xs text-sw-text-dim">{minifig.year}</span>
        </div>
      </div>
    </button>
  );
}
