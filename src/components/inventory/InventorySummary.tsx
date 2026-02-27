import { StatCard } from '../ui/StatCard';
import { DollarSign, TrendingUp, Package } from 'lucide-react';
import type { InventoryStats } from '../../hooks/useInventoryStats';

interface InventorySummaryProps {
  stats: InventoryStats;
}

export function InventorySummary({ stats }: InventorySummaryProps) {
  const gainColor = stats.unrealizedGain >= 0 ? 'text-sw-green' : 'text-sw-red';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Cost Basis"
        value={`$${stats.costBasis.toFixed(2)}`}
        icon={<DollarSign size={14} />}
        color="text-sw-text"
      />
      <StatCard
        label="Market Value"
        value={`$${stats.marketValue.toFixed(2)}`}
        icon={<TrendingUp size={14} />}
        color="text-sw-gold"
      />
      <StatCard
        label="Unrealized Gain"
        value={`${stats.unrealizedGain >= 0 ? '+' : ''}$${stats.unrealizedGain.toFixed(2)}`}
        icon={<TrendingUp size={14} />}
        color={gainColor}
      />
      <StatCard
        label="Inventory Items"
        value={stats.totalItems}
        icon={<Package size={14} />}
        color="text-sw-orange"
      />
    </div>
  );
}
