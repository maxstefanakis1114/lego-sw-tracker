import { useState } from 'react';
import type { CollectionEntry } from '../../types';
import { useSales } from '../../hooks/useSales';
import { SalesSummaryCards } from './SalesSummaryCards';
import { SalesLogTable } from './SalesLogTable';
import { ImportSalesModal } from './ImportSalesModal';
import { Button } from '../ui/Button';
import { Upload } from 'lucide-react';

interface SalesViewProps {
  collection?: Record<string, CollectionEntry>;
  onUpdateEntry?: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onStatusChange?: (minifigId: string, status: CollectionEntry['status']) => void;
}

export function SalesView({ collection, onUpdateEntry, onStatusChange }: SalesViewProps) {
  const { sales, addSale, deleteSale, totals } = useSales();
  const [importOpen, setImportOpen] = useState(false);

  const canImport = collection && onUpdateEntry && onStatusChange;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-sw-text">Sales</h2>
          <p className="text-sm text-sw-text-dim mt-0.5">
            Track your sales, fees, and profit
          </p>
        </div>
        {canImport && (
          <Button onClick={() => setImportOpen(true)} variant="secondary">
            <Upload size={16} />
            Import Whatnot Sales
          </Button>
        )}
      </div>

      <SalesSummaryCards totals={totals} />
      <SalesLogTable sales={sales} onDeleteSale={deleteSale} />

      {canImport && (
        <ImportSalesModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          collection={collection}
          onAddSale={addSale}
          onUpdateEntry={onUpdateEntry}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
