import type { CollectionEntry, SaleRecord, BusinessStats, CatalogMinifig } from '../types';
import { getMarketPrice } from './priceService';

export function computeBusinessStats(
  collection: Record<string, CollectionEntry>,
  sales: SaleRecord[],
  catalogMap: Map<string, CatalogMinifig>,
): BusinessStats {
  // Sales totals
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalFees = 0;
  let totalShippingCost = 0;
  let totalShippingCharged = 0;
  let netProfit = 0;

  for (const s of sales) {
    totalRevenue += s.salePrice;
    totalCOGS += s.costBasis;
    totalFees += s.platformFee;
    totalShippingCost += s.shippingCost;
    totalShippingCharged += s.shippingCharged;
    netProfit += s.netProfit;
  }

  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly sales
  const monthMap = new Map<string, { revenue: number; profit: number; count: number }>();
  for (const s of sales) {
    const month = s.date.slice(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { revenue: 0, profit: 0, count: 0 };
    existing.revenue += s.salePrice;
    existing.profit += s.netProfit;
    existing.count++;
    monthMap.set(month, existing);
  }
  const monthlySales = [...monthMap.entries()]
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Top sellers by profit
  const sellerMap = new Map<string, { profit: number; count: number }>();
  for (const s of sales) {
    const existing = sellerMap.get(s.minifigId) || { profit: 0, count: 0 };
    existing.profit += s.netProfit;
    existing.count++;
    sellerMap.set(s.minifigId, existing);
  }
  const topSellers = [...sellerMap.entries()]
    .map(([minifigId, data]) => ({
      minifigId,
      name: catalogMap.get(minifigId)?.name ?? minifigId,
      ...data,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  // Inventory value
  let inventoryCostBasis = 0;
  let inventoryMarketValue = 0;
  for (const entry of Object.values(collection)) {
    if (entry.status === 'owned' || entry.status === 'for-sale') {
      inventoryCostBasis += (entry.pricePaid ?? 0) * entry.quantity;
      const mkt = entry.askingPrice ?? getMarketPrice(entry.minifigId) ?? 0;
      inventoryMarketValue += mkt * entry.quantity;
    }
  }

  return {
    totalRevenue: round(totalRevenue),
    totalCOGS: round(totalCOGS),
    totalFees: round(totalFees),
    totalShippingCost: round(totalShippingCost),
    totalShippingCharged: round(totalShippingCharged),
    netProfit: round(netProfit),
    margin: Math.round(margin * 10) / 10,
    totalSales: sales.length,
    monthlySales,
    topSellers,
    inventoryCostBasis: round(inventoryCostBasis),
    inventoryMarketValue: round(inventoryMarketValue),
    unrealizedGain: round(inventoryMarketValue - inventoryCostBasis),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
