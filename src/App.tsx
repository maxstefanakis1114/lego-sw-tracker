import { useState, useCallback } from 'react';
import type { TabId } from './types';
import { useCollection } from './hooks/useCollection';
import { usePurchaseLots } from './hooks/usePurchaseLots';
import { useSync } from './hooks/useSync';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { PageContainer } from './components/layout/PageContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { CatalogBrowser } from './components/catalog/CatalogBrowser';
import { CollectionView } from './components/collection/CollectionView';
import { InventoryView } from './components/inventory/InventoryView';
import { SalesView } from './components/sales/SalesView';
import { ExportView } from './components/export/ExportView';
import { RecordSaleModal } from './components/sales/RecordSaleModal';
import { SyncModal } from './components/ui/SyncModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [syncOpen, setSyncOpen] = useState(false);

  // Force re-render key — incremented when remote sync overwrites localStorage
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRemoteUpdate = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const { collection, setStatus, addWithQuantity, updateEntry, removeEntry, bulkAdd } = useCollection();
  const { lots, addLot, deleteLot } = usePurchaseLots();
  const sync = useSync(handleRemoteUpdate);

  // Wrap mutators to trigger sync push after changes
  const withSync = <T extends unknown[], R>(fn: (...args: T) => R) =>
    (...args: T): R => {
      const result = fn(...args);
      sync.schedulePush();
      return result;
    };

  // Record sale modal state — triggerable from any tab
  const [saleMinifigId, setSaleMinifigId] = useState<string | null>(null);

  const handleRecordSale = useCallback((minifigId: string) => {
    setSaleMinifigId(minifigId);
  }, []);

  return (
    <div key={refreshKey} className="min-h-screen bg-sw-black relative">
      <div className="starfield"><div className="stars-layer" /></div>
      <div className="relative z-10">
      <Header
        syncConnected={!!sync.syncId}
        onSyncClick={() => setSyncOpen(true)}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <PageContainer>
        <div key={activeTab} className="tab-transition">
        {activeTab === 'dashboard' && (
          <DashboardView collection={collection} />
        )}
        {activeTab === 'catalog' && (
          <CatalogBrowser
            collection={collection}
            onStatusChange={withSync(setStatus)}
            onAddWithQuantity={withSync(addWithQuantity)}
            onUpdateEntry={withSync(updateEntry)}
            onRemove={withSync(removeEntry)}
          />
        )}
        {activeTab === 'collection' && (
          <CollectionView
            collection={collection}
            onStatusChange={withSync(setStatus)}
            onUpdateEntry={withSync(updateEntry)}
            onRemove={withSync(removeEntry)}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryView
            collection={collection}
            lots={lots}
            onAddLot={withSync(addLot)}
            onDeleteLot={withSync(deleteLot)}
            onStatusChange={withSync(setStatus)}
            onBulkAdd={withSync(bulkAdd)}
            onRecordSale={handleRecordSale}
          />
        )}
        {activeTab === 'sales' && (
          <SalesView
            collection={collection}
            onUpdateEntry={withSync(updateEntry)}
            onStatusChange={withSync(setStatus)}
          />
        )}
        {activeTab === 'export' && (
          <ExportView collection={collection} onUpdateEntry={withSync(updateEntry)} />
        )}
        </div>
      </PageContainer>
      </div>

      <RecordSaleModal
        minifigId={saleMinifigId}
        collection={collection}
        onClose={() => setSaleMinifigId(null)}
        onUpdateEntry={withSync(updateEntry)}
        onStatusChange={withSync(setStatus)}
      />

      <SyncModal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        syncId={sync.syncId}
        syncing={sync.syncing}
        lastSynced={sync.lastSynced}
        error={sync.error}
        onCreate={sync.handleCreate}
        onJoin={sync.handleJoin}
        onDisconnect={sync.handleDisconnect}
        onManualSync={sync.handleManualSync}
      />
    </div>
  );
}
