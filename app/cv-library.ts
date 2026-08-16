import type { CvData } from "./types";

const DATABASE_NAME = "cv-simple";
const STORE_NAME = "cvs";
const DATABASE_VERSION = 1;

export type StoredCv = {
  id: string;
  title: string;
  locale: "es" | "en";
  createdAt: string;
  updatedAt: string;
  data: CvData;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runRequest<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function listStoredCvs(): Promise<StoredCv[]> {
  const items = await runRequest<StoredCv[]>("readonly", (store) => store.getAll());
  return items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getStoredCv(id: string): Promise<StoredCv | undefined> {
  return runRequest<StoredCv | undefined>("readonly", (store) => store.get(id));
}

export function putStoredCv(cv: StoredCv): Promise<IDBValidKey> {
  return runRequest<IDBValidKey>("readwrite", (store) => store.put(cv));
}

export function deleteStoredCv(id: string): Promise<undefined> {
  return runRequest<undefined>("readwrite", (store) => store.delete(id));
}

export function createStoredCv(data: CvData, locale: "es" | "en", title?: string): StoredCv {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title?.trim() || data.name.trim() || (locale === "es" ? "Mi CV" : "My resume"),
    locale,
    createdAt: now,
    updatedAt: now,
    data,
  };
}
