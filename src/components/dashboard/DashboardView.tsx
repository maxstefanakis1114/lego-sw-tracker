import type { CollectionEntry } from '../../types';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useBusinessStats } from '../../hooks/useBusinessStats';
import { useSales } from '../../hooks/useSales';
import { StatCard } from '../ui/StatCard';
import { CollectionProgress } from './CollectionProgress';
import { FactionBreakdown } from './FactionBreakdown';
import { YearTimeline } from './YearTimeline';
import { RecentActivity } from './RecentActivity';
import { PLSummary } from './PLSummary';
import { RevenueChart } from './RevenueChart';
import { TopSellers } from './TopSellers';
import { InventoryValueCard } from './InventoryValueCard';
import { ActionNeeded } from './ActionNeeded';
import { Package, Heart, DollarSign, TrendingUp, Wallet, BadgeDollarSign } from 'lucide-react';

interface DashboardViewProps {
  collection: Record<string, CollectionEntry>;
}

export function DashboardView({ collection }: DashboardViewProps) {
  const stats = useDashboardStats(collection);
  const { sales } = useSales();
  const biz = useBusinessStats(collection, sales);

  return (
    <div className="space-y-6">
      {/* P&L Summary (only shows if sales exist) */}
      <PLSummary stats={biz} />

      {/* Inventory Value + Revenue Chart row */}
      {(biz.inventoryCostBasis > 0 || biz.monthlySales.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <InventoryValueCard
            costBasis={biz.inventoryCostBasis}
            marketValue={biz.inventoryMarketValue}
            unrealizedGain={biz.unrealizedGain}
          />
          <RevenueChart data={biz.monthlySales} />
        </div>
      )}

      {/* Top sellers + Action needed row */}
      {(biz.topSellers.length > 0 || Object.keys(collection).length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <TopSellers sellers={biz.topSellers} />
          <ActionNeeded collection={collection} />
        </div>
      )}

      {/* Divider between business and collection sections */}
      <div className="lightsaber-divider" />

      {/* Collection progress */}
      <CollectionProgress
        owned={stats.totalInCollection}
        total={stats.catalogSize}
        percent={stats.completionPercent}
      />

      {/* Collection stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Owned" value={stats.totalOwned} icon={<Package size={14} />} color="text-sw-green" />
        <StatCard label="Wanted" value={stats.totalWanted} icon={<Heart size={14} />} color="text-sw-blue" />
        <StatCard label="For Sale" value={stats.totalForSale} icon={<DollarSign size={14} />} color="text-sw-orange" />
        <StatCard label="Sold" value={stats.totalSold} icon={<TrendingUp size={14} />} color="text-sw-purple" />
        <StatCard label="Total Paid" value={`$${stats.totalPaid.toFixed(2)}`} icon={<Wallet size={14} />} color="text-sw-text" />
        <StatCard label="Total Sold" value={`$${stats.totalSoldValue.toFixed(2)}`} icon={<BadgeDollarSign size={14} />} color="text-sw-gold" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FactionBreakdown data={stats.factionBreakdown} />
        <div className="space-y-4">
          <YearTimeline data={stats.yearBreakdown} />
          <RecentActivity items={stats.recentActivity} />
        </div>
      </div>
    </div>
  );
}
