import { useMemo } from 'react';
import type { CollectionEntry } from '../types';
import { getMarketPrice } from '../services/priceService';

export interface InventoryStats {
  totalItems: number;
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
  ownedCount: number;
  forSaleCount: number;
  noPriceCount: number;
}

export function useInventoryStats(collection: Record<string, CollectionEntry>): InventoryStats {
  return useMemo(() => {
    let totalItems = 0;
    let costBasis = 0;
    let marketValue = 0;
    let ownedCount = 0;
    let forSaleCount = 0;
    let noPriceCount = 0;

    for (const entry of Object.values(collection)) {
      if (entry.status === 'owned' || entry.status === 'for-sale') {
        totalItems += entry.quantity;
        const paid = entry.pricePaid ?? 0;
        costBasis += paid * entry.quantity;

        const mkt = entry.askingPrice ?? getMarketPrice(entry.minifigId) ?? 0;
        marketValue += mkt * entry.quantity;

        // Count for-sale from both status and forSaleQuantity
        const fsq = entry.forSaleQuantity ?? 0;
        if (entry.status === 'for-sale') {
          forSaleCount += entry.quantity;
        } else if (fsq > 0) {
          forSaleCount += fsq;
          ownedCount += entry.quantity - fsq;
        } else {
          ownedCount += entry.quantity;
        }

        if (!entry.pricePaid) noPriceCount++;
      }
    }

    return {
      totalItems,
      costBasis: Math.round(costBasis * 100) / 100,
      marketValue: Math.round(marketValue * 100) / 100,
      unrealizedGain: Math.round((marketValue - costBasis) * 100) / 100,
      ownedCount,
      forSaleCount,
      noPriceCount,
    };
  }, [collection]);
}
