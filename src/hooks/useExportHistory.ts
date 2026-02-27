import { useCallback } from 'react';
import type { ExportHistoryEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

const HISTORY_KEY = 'export-history';

export function useExportHistory() {
  const [history, setHistory] = useLocalStorage<ExportHistoryEntry[]>(HISTORY_KEY, []);

  const logExport = useCallback((itemCount: number, filename: string) => {
    const entry: ExportHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      itemCount,
      filename,
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  }, [setHistory]);

  return { history, logExport };
}
