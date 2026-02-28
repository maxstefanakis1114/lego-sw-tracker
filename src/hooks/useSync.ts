import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStoredSyncId,
  createSync,
  joinSync,
  pushSync,
  pullSync,
  clearSyncId,
} from '../services/syncService';

export function useSync(onRemoteUpdate: () => void) {
  const [syncId, setSyncId] = useState<string | null>(getStoredSyncId);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Pull on mount if connected
  useEffect(() => {
    if (!syncId) return;
    pullSync().then(data => {
      if (data) {
        setLastSynced(data.lastModified);
        // Check if remote is newer
        const localMod = localStorage.getItem('sync-last-push') || '';
        if (data.lastModified > localMod) {
          // Apply remote data
          if (data.collection) localStorage.setItem('collection', JSON.stringify(data.collection));
          if (data.sales) localStorage.setItem('sales', JSON.stringify(data.sales));
          if (data.purchaseLots) localStorage.setItem('purchase-lots', JSON.stringify(data.purchaseLots));
          onRemoteUpdate();
        }
      }
    });
  }, [syncId, onRemoteUpdate]);

  const handleCreate = useCallback(async () => {
    setSyncing(true);
    setError('');
    try {
      const id = await createSync();
      setSyncId(id);
      localStorage.setItem('sync-last-push', new Date().toISOString());
      setLastSynced(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create sync');
    }
    setSyncing(false);
  }, []);

  const handleJoin = useCallback(async (code: string) => {
    setSyncing(true);
    setError('');
    try {
      const data = await joinSync(code.trim());
      setSyncId(code.trim());
      setLastSynced(data.lastModified);
      onRemoteUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join sync');
    }
    setSyncing(false);
  }, [onRemoteUpdate]);

  const handleDisconnect = useCallback(() => {
    clearSyncId();
    setSyncId(null);
    setLastSynced(null);
    localStorage.removeItem('sync-last-push');
  }, []);

  // Push changes (debounced — call this whenever data changes)
  const schedulePush = useCallback(() => {
    if (!getStoredSyncId()) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await pushSync();
        localStorage.setItem('sync-last-push', new Date().toISOString());
        setLastSynced(new Date().toISOString());
      } catch {
        // Silent fail — will retry on next change
      }
    }, 3000);
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!syncId) return;
    setSyncing(true);
    setError('');
    try {
      // Pull first
      const remote = await pullSync();
      if (remote) {
        const localMod = localStorage.getItem('sync-last-push') || '';
        if (remote.lastModified > localMod) {
          if (remote.collection) localStorage.setItem('collection', JSON.stringify(remote.collection));
          if (remote.sales) localStorage.setItem('sales', JSON.stringify(remote.sales));
          if (remote.purchaseLots) localStorage.setItem('purchase-lots', JSON.stringify(remote.purchaseLots));
          onRemoteUpdate();
        }
      }
      // Then push
      await pushSync();
      localStorage.setItem('sync-last-push', new Date().toISOString());
      setLastSynced(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    }
    setSyncing(false);
  }, [syncId, onRemoteUpdate]);

  return {
    syncId,
    syncing,
    lastSynced,
    error,
    handleCreate,
    handleJoin,
    handleDisconnect,
    handleManualSync,
    schedulePush,
  };
}
