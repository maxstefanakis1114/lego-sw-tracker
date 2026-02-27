import { useCallback, useMemo } from 'react';
import type { SaleRecord } from '../types';
import { useLocalStorage } from './useLocalStorage';

const SALES_KEY = 'sales';

export function useSales() {
  const [sales, setSales] = useLocalStorage<SaleRecord[]>(SALES_KEY, []);

  const addSale = useCallback((sale: Omit<SaleRecord, 'id' | 'dateCreated'>) => {
    const newSale: SaleRecord = {
      ...sale,
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
    };
    setSales(prev => [newSale, ...prev]);
    return newSale;
  }, [setSales]);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, [setSales]);

  const getSalesForMinifig = useCallback((minifigId: string) => {
    return sales.filter(s => s.minifigId === minifigId);
  }, [sales]);

  const totals = useMemo(() => {
    let revenue = 0;
    let costs = 0;
    let fees = 0;
    let shippingCost = 0;
    let shippingCharged = 0;
    let profit = 0;

    for (const s of sales) {
      revenue += s.salePrice;
      costs += s.costBasis;
      fees += s.platformFee;
      shippingCost += s.shippingCost;
      shippingCharged += s.shippingCharged;
      profit += s.netProfit;
    }

    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue: Math.round(revenue * 100) / 100,
      costs: Math.round(costs * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      shippingCharged: Math.round(shippingCharged * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 10) / 10,
      count: sales.length,
    };
  }, [sales]);

  return { sales, addSale, deleteSale, getSalesForMinifig, totals };
}
