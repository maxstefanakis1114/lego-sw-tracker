import { useState, useMemo } from 'react';
import type { SaleRecord, CatalogMinifig } from '../../types';
import { getCatalog } from '../../services/catalogService';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { ArrowUpDown, Trash2, Receipt } from 'lucide-react';

interface SalesLogTableProps {
  sales: SaleRecord[];
  onDeleteSale: (id: string) => void;
}

type SortField = 'date' | 'salePrice' | 'netProfit' | 'platform';

export function SalesLogTable({ sales, onDeleteSale }: SalesLogTableProps) {
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const sorted = useMemo(() => {
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...sales].sort((a, b) => {
      switch (sortBy) {
        case 'date': return dir * a.date.localeCompare(b.date);
        case 'salePrice': return dir * (a.salePrice - b.salePrice);
        case 'netProfit': return dir * (a.netProfit - b.netProfit);
        case 'platform': return dir * a.platform.localeCompare(b.platform);
        default: return 0;
      }
    });
  }, [sales, sortBy, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-12 text-sw-text-dim">
        <Receipt size={40} className="mx-auto mb-3 opacity-30" />
        <p>No sales recorded yet</p>
        <p className="text-sm mt-1">Record a sale from any tab by marking an item as "Sold"</p>
      </div>
    );
  }

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="text-right py-2 px-3 cursor-pointer hover:text-sw-gold transition-colors"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field && <ArrowUpDown size={10} />}
      </span>
    </th>
  );

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sw-border text-sw-text-dim text-xs">
            <th className="text-left py-2 px-3">Item</th>
            <SortHeader field="date" label="Date" />
            <SortHeader field="platform" label="Platform" />
            <SortHeader field="salePrice" label="Sale" />
            <th className="text-right py-2 px-3 hidden sm:table-cell">Cost</th>
            <th className="text-right py-2 px-3 hidden sm:table-cell">Fees</th>
            <SortHeader field="netProfit" label="Profit" />
            <th className="text-right py-2 px-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sw-border">
          {sorted.map(sale => {
            const m = catalogMap.get(sale.minifigId);
            return (
              <tr key={sale.id} className="hover:bg-sw-border/20">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <ImageWithFallback
                      src={m?.imageUrl ?? ''}
                      alt={m?.name ?? sale.minifigId}
                      className="w-8 h-8 rounded"
                    />
                    <div className="min-w-0">
                      <div className="text-sw-text truncate max-w-[160px]">{m?.name ?? sale.minifigId}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-2 px-3 text-sw-text-dim text-xs">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="text-right py-2 px-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sw-border text-sw-text">
                    {sale.platform}
                  </span>
                </td>
                <td className="text-right py-2 px-3 text-sw-gold">
                  ${sale.salePrice.toFixed(2)}
                </td>
                <td className="text-right py-2 px-3 text-sw-text-dim hidden sm:table-cell">
                  ${sale.costBasis.toFixed(2)}
                </td>
                <td className="text-right py-2 px-3 text-sw-text-dim hidden sm:table-cell">
                  ${sale.platformFee.toFixed(2)}
                </td>
                <td className={`text-right py-2 px-3 font-semibold ${sale.netProfit >= 0 ? 'text-sw-green' : 'text-sw-red'}`}>
                  {sale.netProfit >= 0 ? '+' : ''}${sale.netProfit.toFixed(2)}
                </td>
                <td className="text-right py-2 px-3">
                  <button
                    onClick={() => onDeleteSale(sale.id)}
                    className="p-1 rounded hover:bg-sw-red/20 text-sw-text-dim hover:text-sw-red transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
