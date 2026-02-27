import { useCallback, useMemo } from 'react';
import type { PurchaseLot } from '../types';
import { useLocalStorage } from './useLocalStorage';

const LOTS_KEY = 'purchase-lots';

export function usePurchaseLots() {
  const [lots, setLots] = useLocalStorage<PurchaseLot[]>(LOTS_KEY, []);

  const addLot = useCallback((lot: Omit<PurchaseLot, 'id' | 'dateCreated' | 'dateModified'>) => {
    const now = new Date().toISOString();
    const newLot: PurchaseLot = {
      ...lot,
      id: crypto.randomUUID(),
      dateCreated: now,
      dateModified: now,
    };
    setLots(prev => [newLot, ...prev]);
    return newLot;
  }, [setLots]);

  const updateLot = useCallback((id: string, updates: Partial<Omit<PurchaseLot, 'id' | 'dateCreated'>>) => {
    setLots(prev => prev.map(lot =>
      lot.id === id
        ? { ...lot, ...updates, dateModified: new Date().toISOString() }
        : lot
    ));
  }, [setLots]);

  const deleteLot = useCallback((id: string) => {
    setLots(prev => prev.filter(lot => lot.id !== id));
  }, [setLots]);

  const getLot = useCallback((id: string) => {
    return lots.find(lot => lot.id === id);
  }, [lots]);

  const getLotForMinifig = useCallback((minifigId: string): PurchaseLot | undefined => {
    return lots.find(lot => lot.items.some(item => item.minifigId === minifigId));
  }, [lots]);

  const lotMap = useMemo(() => {
    const map = new Map<string, PurchaseLot>();
    for (const lot of lots) map.set(lot.id, lot);
    return map;
  }, [lots]);

  return { lots, addLot, updateLot, deleteLot, getLot, getLotForMinifig, lotMap };
}
