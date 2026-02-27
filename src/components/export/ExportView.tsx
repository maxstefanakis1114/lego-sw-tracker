import type { CollectionEntry } from '../../types';
import { useWhatnotExport } from '../../hooks/useWhatnotExport';
import { ExportSettings } from './ExportSettings';
import { ExportPreview } from './ExportPreview';
import { BatchPricingTools } from './BatchPricingTools';
import { ExportHistory } from './ExportHistory';
import { Button } from '../ui/Button';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ExportViewProps {
  collection: Record<string, CollectionEntry>;
  onUpdateEntry?: (minifigId: string, updates: Partial<CollectionEntry>) => void;
}

export function ExportView({ collection, onUpdateEntry }: ExportViewProps) {
  const { settings, setSettings, forSaleItems, rows, doExport, history } = useWhatnotExport(collection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-sw-text">Whatnot CSV Export</h2>
          <p className="text-sm text-sw-text-dim mt-0.5">
            Export your "For Sale" items as a CSV file for Whatnot bulk import
          </p>
        </div>
        <Button onClick={doExport} disabled={forSaleItems.length === 0} size="lg">
          <Download size={18} />
          Download CSV ({forSaleItems.length} items)
        </Button>
      </div>

      {forSaleItems.length === 0 ? (
        <div className="text-center py-16 text-sw-text-dim glass rounded-xl">
          <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No items marked "For Sale"</p>
          <p className="text-sm mt-1">Mark items as "For Sale" in the Catalog or Collection tab to export them</p>
        </div>
      ) : (
        <>
          {onUpdateEntry && (
            <BatchPricingTools collection={collection} onUpdateEntry={onUpdateEntry} />
          )}
          <ExportSettings settings={settings} onSettingsChange={setSettings} />
          <ExportPreview rows={rows} />
        </>
      )}

      <ExportHistory history={history} />
    </div>
  );
}
