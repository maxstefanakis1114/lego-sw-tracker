import type { SalePlatform } from '../types';

// Platform fee rates (percentage of sale price)
export const PLATFORM_FEES: Record<SalePlatform, number> = {
  whatnot: 0.095,
  ebay: 0.1325,
  bricklink: 0.03,
  mercari: 0.10,
  other: 0,
};

export function getPlatformFee(salePrice: number, platform: SalePlatform): number {
  return Math.round(salePrice * PLATFORM_FEES[platform] * 100) / 100;
}

export function calculateNetProfit(
  salePrice: number,
  platformFee: number,
  costBasis: number,
  shippingCost: number,
  shippingCharged: number,
): number {
  return Math.round((salePrice - platformFee - costBasis - shippingCost + shippingCharged) * 100) / 100;
}

export function applyMarkup(cost: number, markupPercent: number): number {
  return Math.round(cost * (1 + markupPercent / 100) * 100) / 100;
}

export function roundTo99(price: number): number {
  return Math.floor(price) + 0.99;
}

export function applyMarkupAndRound(cost: number, markupPercent: number, doRound: boolean): number {
  let price = applyMarkup(cost, markupPercent);
  if (doRound) price = roundTo99(price);
  return price;
}

// Split total cost equally among items
export function splitCostEqual(totalCost: number, itemCount: number): number[] {
  const base = Math.floor((totalCost / itemCount) * 100) / 100;
  const costs = new Array(itemCount).fill(base);
  // Distribute remainder to first items
  const remainder = Math.round((totalCost - base * itemCount) * 100) / 100;
  const centsLeft = Math.round(remainder * 100);
  for (let i = 0; i < centsLeft; i++) {
    costs[i] = Math.round((costs[i] + 0.01) * 100) / 100;
  }
  return costs;
}

// Split total cost by market value proportion
export function splitCostByMarketValue(
  totalCost: number,
  marketValues: (number | null)[],
): number[] {
  const values = marketValues.map(v => v ?? 0);
  const totalValue = values.reduce((s, v) => s + v, 0);
  if (totalValue === 0) return splitCostEqual(totalCost, values.length);

  const costs = values.map(v => Math.floor((v / totalValue) * totalCost * 100) / 100);
  const allocated = costs.reduce((s, c) => s + c, 0);
  const remainder = Math.round((totalCost - allocated) * 100);
  for (let i = 0; i < remainder; i++) {
    costs[i] = Math.round((costs[i] + 0.01) * 100) / 100;
  }
  return costs;
}
