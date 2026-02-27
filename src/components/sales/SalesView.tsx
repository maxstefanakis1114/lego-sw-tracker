import { useSales } from '../../hooks/useSales';
import { SalesSummaryCards } from './SalesSummaryCards';
import { SalesLogTable } from './SalesLogTable';

export function SalesView() {
  const { sales, deleteSale, totals } = useSales();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-sw-text">Sales</h2>
        <p className="text-sm text-sw-text-dim mt-0.5">
          Track your sales, fees, and profit
        </p>
      </div>

      <SalesSummaryCards totals={totals} />
      <SalesLogTable sales={sales} onDeleteSale={deleteSale} />
    </div>
  );
}
