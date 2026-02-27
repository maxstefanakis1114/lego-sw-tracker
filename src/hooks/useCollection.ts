import { useCallback } from 'react';
import type { CollectionEntry, ItemStatus, ItemCondition } from '../types';
import { useLocalStorage } from './useLocalStorage';

const COLLECTION_KEY = 'collection';

export function useCollection() {
  const [collection, setCollection] = useLocalStorage<Record<string, CollectionEntry>>(COLLECTION_KEY, {});

  const setStatus = useCallback((minifigId: string, status: ItemStatus) => {
    const now = new Date().toISOString();
    setCollection(prev => {
      const existing = prev[minifigId];
      if (existing) {
        return { ...prev, [minifigId]: { ...existing, status, dateModified: now } };
      }
      return {
        ...prev,
        [minifigId]: {
          minifigId,
          status,
          quantity: 1,
          forSaleQuantity: 0,
          condition: 'used' as ItemCondition,
          pricePaid: null,
          priceSold: null,
          askingPrice: null,
          notes: '',
          customImageUrl: '',
          sku: '',
          dateAdded: now,
          dateModified: now,
        },
      };
    });
  }, [setCollection]);

  const addWithQuantity = useCallback((minifigId: string, totalQty: number, condition: ItemCondition, pricePaid: number | null) => {
    const now = new Date().toISOString();
    const forSaleQty = Math.max(0, totalQty - 1);
    setCollection(prev => {
      const existing = prev[minifigId];
      if (existing) {
        return {
          ...prev,
          [minifigId]: {
            ...existing,
            status: 'owned',
            quantity: totalQty,
            forSaleQuantity: forSaleQty,
            condition,
            pricePaid,
            dateModified: now,
          },
        };
      }
      return {
        ...prev,
        [minifigId]: {
          minifigId,
          status: 'owned',
          quantity: totalQty,
          forSaleQuantity: forSaleQty,
          condition,
          pricePaid,
          priceSold: null,
          askingPrice: null,
          notes: '',
          customImageUrl: '',
          sku: '',
          dateAdded: now,
          dateModified: now,
        },
      };
    });
  }, [setCollection]);

  const updateEntry = useCallback((minifigId: string, updates: Partial<CollectionEntry>) => {
    setCollection(prev => {
      const existing = prev[minifigId];
      if (!existing) return prev;
      return {
        ...prev,
        [minifigId]: { ...existing, ...updates, dateModified: new Date().toISOString() },
      };
    });
  }, [setCollection]);

  const removeEntry = useCallback((minifigId: string) => {
    setCollection(prev => {
      const next = { ...prev };
      delete next[minifigId];
      return next;
    });
  }, [setCollection]);

  const bulkAdd = useCallback((items: Array<{ minifigId: string; pricePaid: number; purchaseLotId: string }>) => {
    const now = new Date().toISOString();
    setCollection(prev => {
      const next = { ...prev };
      for (const item of items) {
        const existing = next[item.minifigId];
        if (existing) {
          next[item.minifigId] = {
            ...existing,
            pricePaid: item.pricePaid,
            purchaseLotId: item.purchaseLotId,
            status: existing.status === 'wanted' ? 'owned' : existing.status,
            dateModified: now,
          };
        } else {
          next[item.minifigId] = {
            minifigId: item.minifigId,
            status: 'owned',
            quantity: 1,
            forSaleQuantity: 0,
            condition: 'used' as ItemCondition,
            pricePaid: item.pricePaid,
            priceSold: null,
            askingPrice: null,
            notes: '',
            customImageUrl: '',
            sku: '',
            dateAdded: now,
            dateModified: now,
            purchaseLotId: item.purchaseLotId,
          };
        }
      }
      return next;
    });
  }, [setCollection]);

  return { collection, setStatus, addWithQuantity, updateEntry, removeEntry, bulkAdd };
}
