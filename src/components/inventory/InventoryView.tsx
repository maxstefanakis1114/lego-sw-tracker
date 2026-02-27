import { useState, useMemo } from 'react';
import type { CollectionEntry, PurchaseLot, PurchaseLotItem, ItemStatus, CatalogMinifig } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { getMarketPrice } from '../../services/priceService';
import { useInventoryStats } from '../../hooks/useInventoryStats';
import { InventorySummary } from './InventorySummary';
import { AddPurchaseLotModal } from './AddPurchaseLotModal';
import { PurchaseLotsList } from './PurchaseLotsList';
import { QuickStatusButtons } from './QuickStatusButtons';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { Button } from '../ui/Button';
import { Plus, Package, ShoppingBag, Search } from 'lucide-react';

interface InventoryViewProps {
  collection: Record<string, CollectionEntry>;
  lots: PurchaseLot[];
  onAddLot: (lot: Omit<PurchaseLot, 'id' | 'dateCreated' | 'dateModified'>) => PurchaseLot;
  onDeleteLot: (id: string) => void;
  onStatusChange: (minifigId: string, status: ItemStatus) => void;
  onBulkAdd: (items: Array<{ minifigId: string; pricePaid: number; purchaseLotId: string }>) => void;
  onRecordSale?: (minifigId: string) => void;
}

type SubTab = 'items' | 'lots';

export function InventoryView({
  collection,
  lots,
  onAddLot,
  onDeleteLot,
  onStatusChange,
  onBulkAdd,
  onRecordSale,
}: InventoryViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('items');
  const [showAddLot, setShowAddLot] = useState(false);
  const [search, setSearch] = useState('');

  const stats = useInventoryStats(collection);

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const inventoryItems = useMemo(() => {
    let entries = Object.values(collection).filter(
      e => e.status === 'owned' || e.status === 'for-sale' || (e.forSaleQuantity ?? 0) > 0
    );

    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e => {
        const m = catalogMap.get(e.minifigId);
        return m && (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          (e.sku && e.sku.toLowerCase().includes(q)) ||
          (e.storageLocation && e.storageLocation.toLowerCase().includes(q))
        );
      });
    }

    return entries
      .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
      .map(entry => ({
        entry,
        minifig: catalogMap.get(entry.minifigId)!,
        marketPrice: getMarketPrice(entry.minifigId),
      }))
      .filter(item => item.minifig);
  }, [collection, search, catalogMap]);

  const handleCreateLot = (lotData: {
    name: string;
    source: string;
    totalCost: number;
    items: PurchaseLotItem[];
    notes: string;
  }) => {
    const lot = onAddLot(lotData);
    onBulkAdd(
      lotData.items.map(item => ({
        minifigId: item.minifigId,
        pricePaid: item.allocatedCost,
        purchaseLotId: lot.id,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-sw-text">Inventory</h2>
          <p className="text-sm text-sw-text-dim mt-0.5">
            Track your inventory, costs, and purchase lots
          </p>
        </div>
        <Button onClick={() => setShowAddLot(true)}>
          <Plus size={16} />
          Add Purchase Lot
        </Button>
      </div>

      <InventorySummary stats={stats} />

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-sw-border">
        <button
          onClick={() => setSubTab('items')}
          className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors cursor-pointer ${
            subTab === 'items' ? 'border-sw-gold text-sw-gold' : 'border-transparent text-sw-text-dim hover:text-sw-text'
          }`}
        >
          <Package size={14} />
          Inventory Items ({inventoryItems.length})
        </button>
        <button
          onClick={() => setSubTab('lots')}
          className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors cursor-pointer ${
            subTab === 'lots' ? 'border-sw-gold text-sw-gold' : 'border-transparent text-sw-text-dim hover:text-sw-text'
          }`}
        >
          <ShoppingBag size={14} />
          Purchase Lots ({lots.length})
        </button>
      </div>

      {subTab === 'items' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text-dim" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="w-full bg-sw-dark border border-sw-border rounded-lg pl-9 pr-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50"
            />
          </div>

          {inventoryItems.length === 0 ? (
            <div className="text-center py-12 text-sw-text-dim">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>No inventory items</p>
              <p className="text-sm mt-1">Add items from the catalog or create a purchase lot</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sw-border text-sw-text-dim text-xs">
                    <th className="text-left py-2 px-3">Item</th>
                    <th className="text-right py-2 px-3 hidden sm:table-cell">Cost</th>
                    <th className="text-right py-2 px-3 hidden sm:table-cell">Market</th>
                    <th className="text-right py-2 px-3 hidden md:table-cell">Gain</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sw-border">
                  {inventoryItems.map(({ entry, minifig, marketPrice }) => {
                    const cost = entry.pricePaid ?? 0;
                    const mkt = entry.askingPrice ?? marketPrice ?? 0;
                    const gain = mkt - cost;
                    return (
                      <tr key={entry.minifigId} className="hover:bg-sw-border/20">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <ImageWithFallback
                              src={minifig.imageUrl}
                              alt={minifig.name}
                              className="w-8 h-8 rounded"
                            />
                            <div className="min-w-0">
                              <div className="text-sw-text truncate max-w-[200px]">{minifig.name}</div>
                              <div className="text-xs text-sw-text-dim">{minifig.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-2 px-3 text-sw-text hidden sm:table-cell">
                          {entry.pricePaid !== null ? `$${cost.toFixed(2)}` : '—'}
                        </td>
                        <td className="text-right py-2 px-3 text-sw-gold hidden sm:table-cell">
                          {mkt > 0 ? `$${mkt.toFixed(2)}` : '—'}
                        </td>
                        <td className={`text-right py-2 px-3 hidden md:table-cell ${gain >= 0 ? 'text-sw-green' : 'text-sw-red'}`}>
                          {entry.pricePaid !== null && mkt > 0
                            ? `${gain >= 0 ? '+' : ''}$${gain.toFixed(2)}`
                            : '—'
                          }
                        </td>
                        <td className="text-center py-2 px-3">
                          <div className="flex flex-col items-center gap-0.5">
                            {entry.quantity > 1 ? (
                              <>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sw-green/20 text-sw-green">
                                  {entry.quantity - (entry.forSaleQuantity ?? 0)} kept
                                </span>
                                {(entry.forSaleQuantity ?? 0) > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-sw-orange/20 text-sw-orange">
                                    {entry.forSaleQuantity} for sale
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                entry.status === 'for-sale'
                                  ? 'bg-sw-orange/20 text-sw-orange'
                                  : 'bg-sw-green/20 text-sw-green'
                              }`}>
                                {entry.status === 'for-sale' ? 'For Sale' : 'Owned'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-2 px-3">
                          <QuickStatusButtons
                            currentStatus={entry.status}
                            onStatusChange={status => onStatusChange(entry.minifigId, status)}
                            onRecordSale={onRecordSale ? () => onRecordSale(entry.minifigId) : undefined}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'lots' && (
        <PurchaseLotsList lots={lots} onDeleteLot={onDeleteLot} />
      )}

      <AddPurchaseLotModal
        open={showAddLot}
        onClose={() => setShowAddLot(false)}
        onSave={handleCreateLot}
      />
    </div>
  );
}
