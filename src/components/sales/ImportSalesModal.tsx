import { useState, useRef } from 'react';
import type { CollectionEntry, SaleRecord } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { parseSalesCSV, type MatchedSale } from '../../services/csvImport';
import { getPlatformFee, calculateNetProfit } from '../../services/financialService';
import { Upload, Check, X, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface ImportSalesModalProps {
  open: boolean;
  onClose: () => void;
  collection: Record<string, CollectionEntry>;
  onAddSale: (sale: Omit<SaleRecord, 'id' | 'dateCreated'>) => void;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
  onStatusChange: (minifigId: string, status: CollectionEntry['status']) => void;
}

export function ImportSalesModal({
  open, onClose, collection, onAddSale, onUpdateEntry, onStatusChange,
}: ImportSalesModalProps) {
  const [matches, setMatches] = useState<MatchedSale[]>([]);
  const [imported, setImported] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseSalesCSV(text, collection);
      setMatches(parsed);
      setImported(false);
    };
    reader.readAsText(file);
  };

  const matched = matches.filter(m => m.minifigId && m.entry);
  const unmatched = matches.filter(m => !m.minifigId || !m.entry);

  const handleImport = () => {
    let count = 0;

    for (const m of matched) {
      if (!m.minifigId || !m.entry) continue;

      const { salePrice, quantity, date } = m.row;
      const costBasis = m.entry.pricePaid ?? 0;
      const platformFee = getPlatformFee(salePrice, 'whatnot');
      const netProfit = calculateNetProfit(salePrice, platformFee, costBasis, 0, 0);

      // Record the sale
      onAddSale({
        minifigId: m.minifigId,
        salePrice,
        platform: 'whatnot',
        platformFee,
        shippingCost: 0,
        shippingCharged: 0,
        costBasis,
        netProfit,
        date: date || new Date().toISOString().slice(0, 10),
        notes: 'Imported from Whatnot CSV',
      });

      // Update inventory
      const currentQty = m.entry.quantity;
      const soldQty = Math.min(quantity, currentQty);
      const remainingQty = currentQty - soldQty;

      if (remainingQty <= 0) {
        // All sold — mark as sold
        onUpdateEntry(m.minifigId, { priceSold: salePrice });
        onStatusChange(m.minifigId, 'sold');
      } else {
        // Partial — decrement quantities
        const newForSale = Math.max(0, (m.entry.forSaleQuantity ?? 0) - soldQty);
        const newCracked = Math.max(0, Math.min(m.entry.crackedQuantity ?? 0, remainingQty));
        onUpdateEntry(m.minifigId, {
          quantity: remainingQty,
          forSaleQuantity: newForSale,
          crackedQuantity: newCracked,
          priceSold: salePrice,
        });
      }

      count++;
    }

    setImportCount(count);
    setImported(true);
  };

  const handleClose = () => {
    setMatches([]);
    setImported(false);
    setImportCount(0);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Whatnot Sales">
      <div className="space-y-4">
        {!imported && matches.length === 0 && (
          <>
            <div className="text-center py-6">
              <FileSpreadsheet size={40} className="mx-auto mb-3 text-sw-blue opacity-60" />
              <p className="text-sw-text mb-1">Import your Whatnot sales CSV</p>
              <p className="text-sm text-sw-text-dim mb-4">
                Upload the CSV export from Whatnot to automatically mark items as sold and update your inventory.
                Items are matched by SKU.
              </p>
            </div>

            <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-sw-gold/10 border border-sw-gold/30 text-sw-gold font-semibold hover:bg-sw-gold/20 transition-colors cursor-pointer">
              <Upload size={18} />
              Choose CSV File
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          </>
        )}

        {!imported && matches.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-lg bg-sw-green/10 border border-sw-green/30 text-center">
                <p className="text-2xl font-bold text-sw-green">{matched.length}</p>
                <p className="text-xs text-sw-text-dim">Matched</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-sw-red/10 border border-sw-red/30 text-center">
                <p className="text-2xl font-bold text-sw-red">{unmatched.length}</p>
                <p className="text-xs text-sw-text-dim">Unmatched</p>
              </div>
            </div>

            {/* Matched items */}
            {matched.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sw-text-dim">Will be imported:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {matched.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-sw-dark/50 border border-sw-border/50">
                      <Check size={14} className="text-sw-green shrink-0" />
                      {m.minifig && (
                        <ImageWithFallback
                          src={m.minifig.imageUrl}
                          alt={m.minifig.name}
                          className="w-8 h-8 rounded bg-sw-dark"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sw-text truncate">{m.minifig?.name ?? m.row.title}</p>
                        <p className="text-xs text-sw-text-dim">
                          Qty: {m.row.quantity} &middot; ${m.row.salePrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched items */}
            {unmatched.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sw-text-dim flex items-center gap-1">
                  <AlertTriangle size={12} className="text-sw-orange" />
                  Not matched (will be skipped):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {unmatched.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-sw-dark/50 border border-sw-border/50 opacity-60">
                      <X size={14} className="text-sw-red shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sw-text truncate">{m.row.title || m.row.sku || '(no title)'}</p>
                        <p className="text-xs text-sw-text-dim">SKU: {m.row.sku || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={matched.length === 0} className="flex-1">
                Import {matched.length} Sale{matched.length !== 1 ? 's' : ''}
              </Button>
              <Button variant="secondary" onClick={() => { setMatches([]); if (fileRef.current) fileRef.current.value = ''; }}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {imported && (
          <div className="text-center py-6">
            <Check size={40} className="mx-auto mb-3 text-sw-green" />
            <p className="text-sw-text font-semibold">Imported {importCount} sale{importCount !== 1 ? 's' : ''}</p>
            <p className="text-sm text-sw-text-dim mt-1">
              Inventory quantities have been updated and sales recorded.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
