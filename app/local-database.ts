const DATABASE_NAME = "cv-simple";
const DATABASE_VERSION = 2;

export const CV_STORE_NAME = "cvs";
export const APPLICATION_STORE_NAME = "applications";

export function openLocalDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CV_STORE_NAME)) {
        database.createObjectStore(CV_STORE_NAME, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(APPLICATION_STORE_NAME)) {
        const store = database.createObjectStore(APPLICATION_STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("cvId", "cvId", { unique: false });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("database_upgrade_blocked"));
  });
}

export async function runStoreRequest<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openLocalDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
