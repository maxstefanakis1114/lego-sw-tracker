import { StatCard } from '../ui/StatCard';
import { DollarSign, TrendingUp, Receipt, Percent } from 'lucide-react';

interface SalesSummaryCardsProps {
  totals: {
    revenue: number;
    costs: number;
    fees: number;
    profit: number;
    margin: number;
    count: number;
  };
}

export function SalesSummaryCards({ totals }: SalesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard
        label="Revenue"
        value={`$${totals.revenue.toFixed(2)}`}
        icon={<DollarSign size={14} />}
        color="text-sw-gold"
      />
      <StatCard
        label="Costs"
        value={`$${totals.costs.toFixed(2)}`}
        icon={<Receipt size={14} />}
        color="text-sw-text"
      />
      <StatCard
        label="Fees"
        value={`$${totals.fees.toFixed(2)}`}
        icon={<Receipt size={14} />}
        color="text-sw-orange"
      />
      <StatCard
        label="Net Profit"
        value={`${totals.profit >= 0 ? '+' : ''}$${totals.profit.toFixed(2)}`}
        icon={<TrendingUp size={14} />}
        color={totals.profit >= 0 ? 'text-sw-green' : 'text-sw-red'}
      />
      <StatCard
        label="Margin"
        value={`${totals.margin.toFixed(1)}%`}
        icon={<Percent size={14} />}
        color={totals.margin >= 0 ? 'text-sw-green' : 'text-sw-red'}
      />
    </div>
  );
}
