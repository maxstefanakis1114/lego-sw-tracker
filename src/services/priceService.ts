import priceData from '../data/prices.json';

interface PriceEntry {
  valueNew: number | null;
  valueUsed: number | null;
  bricklinkId: string;
}

const prices = priceData as Record<string, PriceEntry>;

export function getPrice(minifigId: string): PriceEntry | undefined {
  return prices[minifigId];
}

export function getMarketPrice(minifigId: string): number | null {
  const p = prices[minifigId];
  return p?.valueUsed ?? p?.valueNew ?? null;
}

export function getBricklinkId(minifigId: string): string | undefined {
  return prices[minifigId]?.bricklinkId;
}

export function getAllPrices(): Record<string, PriceEntry> {
  return prices;
}
