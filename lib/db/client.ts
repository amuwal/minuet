import {
  STORE_AUDIO,
  STORE_MEETINGS,
  STORE_PROJECTS,
  type StoreName,
} from "./schema";

const DB_NAME = "minuet";
const DB_VERSION = 1;

let _dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEETINGS)) {
        const s = db.createObjectStore(STORE_MEETINGS, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt");
        s.createIndex("projectId", "projectId");
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: "meetingId" });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const s = db.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
        s.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

async function transact<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const dbGet = <T>(store: StoreName, id: string) =>
  transact<T | undefined>(store, "readonly", (s) => s.get(id));

export const dbGetAll = <T>(store: StoreName) =>
  transact<T[]>(store, "readonly", (s) => s.getAll());

export const dbPut = <T>(store: StoreName, value: T) =>
  transact<IDBValidKey>(store, "readwrite", (s) => s.put(value));

export const dbDelete = (store: StoreName, id: string) =>
  transact<undefined>(store, "readwrite", (s) => s.delete(id));

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
