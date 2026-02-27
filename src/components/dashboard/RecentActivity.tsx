import type { CatalogMinifig, CollectionEntry } from '../../types';
import { Badge } from '../ui/Badge';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface RecentActivityProps {
  items: Array<{ entry: CollectionEntry; minifig: CatalogMinifig }>;
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-sw-text-dim mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="text-sw-text-dim text-sm text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-2">
          {items.map(({ entry, minifig }) => (
            <div key={entry.minifigId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sw-border/20">
              <ImageWithFallback
                src={minifig.imageUrl}
                alt={minifig.name}
                className="w-10 h-10 rounded bg-sw-dark shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sw-text truncate">{minifig.name}</p>
                <p className="text-xs text-sw-text-dim">
                  {new Date(entry.dateModified).toLocaleDateString()}
                </p>
              </div>
              <Badge status={entry.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
