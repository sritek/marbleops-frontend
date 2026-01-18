/**
 * IndexedDB wrapper for offline data persistence
 */

const DB_NAME = "marbleops_offline";
const DB_VERSION = 1;

// Store names
export const STORES = {
  INVENTORY: "inventory",
  PARTIES: "parties",
  PENDING_MUTATIONS: "pendingMutations",
  CACHE_METADATA: "cacheMetadata",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Inventory store
      if (!database.objectStoreNames.contains(STORES.INVENTORY)) {
        const inventoryStore = database.createObjectStore(STORES.INVENTORY, {
          keyPath: "id",
        });
        inventoryStore.createIndex("storeId", "storeId", { unique: false });
        inventoryStore.createIndex("status", "status", { unique: false });
      }

      // Parties store
      if (!database.objectStoreNames.contains(STORES.PARTIES)) {
        const partiesStore = database.createObjectStore(STORES.PARTIES, {
          keyPath: "id",
        });
        partiesStore.createIndex("type", "type", { unique: false });
      }

      // Pending mutations (offline writes)
      if (!database.objectStoreNames.contains(STORES.PENDING_MUTATIONS)) {
        const mutationsStore = database.createObjectStore(
          STORES.PENDING_MUTATIONS,
          { keyPath: "id", autoIncrement: true }
        );
        mutationsStore.createIndex("createdAt", "createdAt", { unique: false });
        mutationsStore.createIndex("type", "type", { unique: false });
      }

      // Cache metadata
      if (!database.objectStoreNames.contains(STORES.CACHE_METADATA)) {
        database.createObjectStore(STORES.CACHE_METADATA, { keyPath: "key" });
      }
    };
  });
}

/**
 * Get all items from a store
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get item by ID
 */
export async function getById<T>(
  storeName: StoreName,
  id: string
): Promise<T | undefined> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Add or update an item
 */
export async function put<T>(storeName: StoreName, item: T): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Add multiple items
 */
export async function putMany<T>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    items.forEach((item) => store.put(item));

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

/**
 * Delete an item by ID
 */
export async function deleteById(
  storeName: StoreName,
  id: string
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all items in a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Pending mutation interface
 */
export interface PendingMutation {
  id?: number;
  type: "create" | "update" | "delete";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  body?: unknown;
  createdAt: number;
}

/**
 * Add a pending mutation
 */
export async function addPendingMutation(
  mutation: Omit<PendingMutation, "id">
): Promise<void> {
  await put(STORES.PENDING_MUTATIONS, mutation);
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  return getAll<PendingMutation>(STORES.PENDING_MUTATIONS);
}

/**
 * Delete a pending mutation
 */
export async function deletePendingMutation(id: number): Promise<void> {
  await deleteById(STORES.PENDING_MUTATIONS, String(id));
}

/**
 * Get cache metadata
 */
export async function getCacheTimestamp(key: string): Promise<number | null> {
  const metadata = await getById<{ key: string; timestamp: number }>(
    STORES.CACHE_METADATA,
    key
  );
  return metadata?.timestamp ?? null;
}

/**
 * Set cache metadata
 */
export async function setCacheTimestamp(key: string): Promise<void> {
  await put(STORES.CACHE_METADATA, { key, timestamp: Date.now() });
}
