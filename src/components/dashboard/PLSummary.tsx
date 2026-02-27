import { StatCard } from '../ui/StatCard';
import { DollarSign, TrendingUp, Receipt, Percent, Hash } from 'lucide-react';
import type { BusinessStats } from '../../types';

interface PLSummaryProps {
  stats: BusinessStats;
}

export function PLSummary({ stats }: PLSummaryProps) {
  if (stats.totalSales === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-sw-text-dim">Profit & Loss</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={<DollarSign size={14} />}
          color="text-sw-gold"
        />
        <StatCard
          label="COGS"
          value={`$${stats.totalCOGS.toFixed(2)}`}
          icon={<Receipt size={14} />}
          color="text-sw-text"
        />
        <StatCard
          label="Fees"
          value={`$${stats.totalFees.toFixed(2)}`}
          icon={<Receipt size={14} />}
          color="text-sw-orange"
        />
        <StatCard
          label="Net Profit"
          value={`${stats.netProfit >= 0 ? '+' : ''}$${stats.netProfit.toFixed(2)}`}
          icon={<TrendingUp size={14} />}
          color={stats.netProfit >= 0 ? 'text-sw-green' : 'text-sw-red'}
        />
        <StatCard
          label="Margin"
          value={`${stats.margin.toFixed(1)}%`}
          icon={<Percent size={14} />}
          color={stats.margin >= 0 ? 'text-sw-green' : 'text-sw-red'}
        />
        <StatCard
          label="Sales"
          value={stats.totalSales}
          icon={<Hash size={14} />}
          color="text-sw-purple"
        />
      </div>
    </div>
  );
}
