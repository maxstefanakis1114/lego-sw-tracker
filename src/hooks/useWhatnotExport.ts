import { useMemo, useCallback } from 'react';
import type { CollectionEntry, CatalogMinifig, ExportSettings } from '../types';
import { getCatalog } from '../services/catalogService';
import { buildWhatnotRows, generateCSV, downloadCSV } from '../services/csvExport';
import { useLocalStorage } from './useLocalStorage';
import { useExportHistory } from './useExportHistory';

const defaultSettings: ExportSettings = {
  shippingPrice: '0',
  defaultCondition: 'Used',
  descriptionTemplate: 'LEGO Star Wars Minifigure: {name} ({id}) - Year: {year} - Condition: {condition}. {notes}',
};

export function useWhatnotExport(collection: Record<string, CollectionEntry>) {
  const [settings, setSettings] = useLocalStorage<ExportSettings>('export-settings', defaultSettings);
  const { history, logExport } = useExportHistory();

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogMinifig>();
    for (const m of getCatalog()) map.set(m.id, m);
    return map;
  }, []);

  const forSaleItems = useMemo(() => {
    return Object.values(collection)
      .filter(e => e.status === 'for-sale')
      .map(entry => {
        const minifig = catalogMap.get(entry.minifigId);
        return minifig ? { entry, minifig } : null;
      })
      .filter(Boolean) as Array<{ entry: CollectionEntry; minifig: CatalogMinifig }>;
  }, [collection, catalogMap]);

  const rows = useMemo(
    () => buildWhatnotRows(forSaleItems, settings),
    [forSaleItems, settings]
  );

  const doExport = useCallback(() => {
    const csv = generateCSV(rows);
    const date = new Date().toISOString().split('T')[0];
    const filename = `whatnot-lego-sw-${date}.csv`;
    downloadCSV(csv, filename);
    logExport(rows.length, filename);
  }, [rows, logExport]);

  return {
    settings,
    setSettings,
    forSaleItems,
    rows,
    doExport,
    history,
  };
}
