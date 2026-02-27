import { useState, useCallback } from 'react';
import type { TabId } from './types';
import { useCollection } from './hooks/useCollection';
import { usePurchaseLots } from './hooks/usePurchaseLots';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { collection, setStatus, addWithQuantity, updateEntry, removeEntry, bulkAdd } = useCollection();
  const { lots, addLot, deleteLot } = usePurchaseLots();

  // Record sale modal state — triggerable from any tab
  const [saleMinifigId, setSaleMinifigId] = useState<string | null>(null);

  const handleRecordSale = useCallback((minifigId: string) => {
    setSaleMinifigId(minifigId);
  }, []);

  return (
    <div className="min-h-screen bg-sw-black relative">
      <div className="starfield"><div className="stars-layer" /></div>
      <div className="relative z-10">
      <Header />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <PageContainer>
        <div key={activeTab} className="tab-transition">
        {activeTab === 'dashboard' && (
          <DashboardView collection={collection} />
        )}
        {activeTab === 'catalog' && (
          <CatalogBrowser
            collection={collection}
            onStatusChange={setStatus}
            onAddWithQuantity={addWithQuantity}
            onUpdateEntry={updateEntry}
            onRemove={removeEntry}
          />
        )}
        {activeTab === 'collection' && (
          <CollectionView
            collection={collection}
            onStatusChange={setStatus}
            onUpdateEntry={updateEntry}
            onRemove={removeEntry}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryView
            collection={collection}
            lots={lots}
            onAddLot={addLot}
            onDeleteLot={deleteLot}
            onStatusChange={setStatus}
            onBulkAdd={bulkAdd}
            onRecordSale={handleRecordSale}
          />
        )}
        {activeTab === 'sales' && (
          <SalesView />
        )}
        {activeTab === 'export' && (
          <ExportView collection={collection} onUpdateEntry={updateEntry} />
        )}
        </div>
      </PageContainer>
      </div>

      <RecordSaleModal
        minifigId={saleMinifigId}
        collection={collection}
        onClose={() => setSaleMinifigId(null)}
        onUpdateEntry={updateEntry}
        onStatusChange={setStatus}
      />
    </div>
  );
}
