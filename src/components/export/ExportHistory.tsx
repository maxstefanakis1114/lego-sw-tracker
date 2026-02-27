import type { ExportHistoryEntry } from '../../types';
import { History } from 'lucide-react';

interface ExportHistoryProps {
  history: ExportHistoryEntry[];
}

export function ExportHistory({ history }: ExportHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-sw-text-dim flex items-center gap-1.5">
        <History size={14} />
        Export History
      </h3>
      <div className="space-y-1">
        {history.slice(0, 10).map(entry => (
          <div key={entry.id} className="flex items-center justify-between text-sm py-1">
            <span className="text-sw-text">{entry.filename}</span>
            <span className="text-sw-text-dim text-xs">
              {entry.itemCount} items &middot; {new Date(entry.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
