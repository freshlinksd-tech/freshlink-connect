/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'freshlink-pwa-cache';
const DB_VERSION = 1;
const STORE_NAME = 'json-data';

export interface CacheItem {
  key: string;
  value: any;
  updatedAt: string;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

export async function setCache(key: string, value: any): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const item: CacheItem = {
        key,
        value,
        updatedAt: new Date().toISOString()
      };

      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB caching failed for key ${key}:`, err);
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CacheItem | undefined;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB retrieval failed for key ${key}:`, err);
    return null;
  }
}

export interface PendingInteraction {
  id: string;
  type: 'like' | 'comment';
  postId: string;
  userId: string;
  payload: any; // e.g. commentText, commentId, etc.
  createdAt: string;
}

export async function addPendingInteraction(interaction: Omit<PendingInteraction, 'id' | 'createdAt'>): Promise<void> {
  const list = await getCache<PendingInteraction[]>('pending-interactions') || [];
  const newItem: PendingInteraction = {
    ...interaction,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  list.push(newItem);
  await setCache('pending-interactions', list);
}

export async function getPendingInteractions(): Promise<PendingInteraction[]> {
  return await getCache<PendingInteraction[]>('pending-interactions') || [];
}

export async function clearPendingInteractions(idsToClear?: string[]): Promise<void> {
  if (!idsToClear) {
    await setCache('pending-interactions', []);
    return;
  }
  const list = await getCache<PendingInteraction[]>('pending-interactions') || [];
  const filtered = list.filter(item => !idsToClear.includes(item.id));
  await setCache('pending-interactions', filtered);
}

