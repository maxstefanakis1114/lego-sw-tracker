import { loadFromStorage, saveToStorage } from './storage';

const API = 'https://jsonblob.com/api/jsonBlob';

export interface SyncPayload {
  collection: Record<string, unknown>;
  sales: unknown[];
  purchaseLots: unknown[];
  lastModified: string;
}

function getSyncId(): string | null {
  return localStorage.getItem('sync-id');
}

function setSyncId(id: string) {
  localStorage.setItem('sync-id', id);
}

export function clearSyncId() {
  localStorage.removeItem('sync-id');
}

export function getStoredSyncId(): string | null {
  return getSyncId();
}

function buildPayload(): SyncPayload {
  return {
    collection: loadFromStorage<Record<string, unknown>>('collection', {}),
    sales: loadFromStorage<unknown[]>('sales', []),
    purchaseLots: loadFromStorage<unknown[]>('purchase-lots', []),
    lastModified: new Date().toISOString(),
  };
}

function applyPayload(data: SyncPayload) {
  if (data.collection) saveToStorage('collection', data.collection);
  if (data.sales) saveToStorage('sales', data.sales);
  if (data.purchaseLots) saveToStorage('purchase-lots', data.purchaseLots);
}

/** Create a new sync blob and return its ID */
export async function createSync(): Promise<string> {
  const payload = buildPayload();
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create sync (${res.status})`);

  // Try multiple ways to get the blob ID
  const id =
    res.headers.get('X-jsonblob-id') ||
    res.headers.get('Location')?.split('/').pop() ||
    '';

  if (!id) throw new Error('No sync ID returned — try again');
  setSyncId(id);
  return id;
}

/** Connect to an existing sync blob */
export async function joinSync(id: string): Promise<SyncPayload> {
  const res = await fetch(`${API}/${id}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('Sync code not found. Check the code and try again.');
  const data: SyncPayload = await res.json();
  applyPayload(data);
  setSyncId(id);
  return data;
}

/** Push local data to the cloud */
export async function pushSync(): Promise<void> {
  const id = getSyncId();
  if (!id) return;
  const payload = buildPayload();
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // If blob was deleted/expired, clear the stale sync ID
    if (res.status === 404) {
      clearSyncId();
      throw new Error('Sync expired — please create a new sync code');
    }
    throw new Error(`Failed to push sync (${res.status})`);
  }
}

/** Pull cloud data and apply locally */
export async function pullSync(): Promise<SyncPayload | null> {
  const id = getSyncId();
  if (!id) return null;
  const res = await fetch(`${API}/${id}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 404) {
      clearSyncId();
    }
    return null;
  }
  const data: SyncPayload = await res.json();
  return data;
}
