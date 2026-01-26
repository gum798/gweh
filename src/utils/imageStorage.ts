/**
 * IndexedDB utility for storing large image data
 * client-localstorage-schema: Use IndexedDB instead of localStorage for large data
 */

const DB_NAME = 'mystic_ai_storage';
const STORE_NAME = 'fashion_images';
const DB_VERSION = 1;

interface FashionImageData {
  image: string;
  height: string;
  weight: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function storeFashionData(
  key: string,
  data: Omit<FashionImageData, 'timestamp'>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ ...data, timestamp: Date.now() }, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    tx.oncomplete = () => db.close();
  });
}

export async function getFashionData(key: string): Promise<FashionImageData | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);

      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function deleteFashionData(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      tx.oncomplete = () => db.close();
    });
  } catch {
    // Ignore errors when deleting
  }
}
