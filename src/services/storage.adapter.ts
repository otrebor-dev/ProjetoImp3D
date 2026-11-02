export type StoreName =
  | 'users'
  | 'equipments'
  | 'projects'
  | 'quotes'
  | 'orders'
  | 'messages'
  | 'notifications';

export interface StoredFileBlob {
  key: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

/**
 * Camada de abstração de persistência (Repository/Adapter Pattern).
 * Permite substituir futuramente o IndexedDB/LocalStorage por chamadas HTTP REST
 * sem acoplamento nos serviços de domínio ou componentes visuais.
 */
export interface IStorageAdapter {
  init(): Promise<void>;
  getAll<T>(store: StoreName): Promise<T[]>;
  getById<T>(store: StoreName, id: string): Promise<T | undefined>;
  put<T extends { id: string }>(store: StoreName, item: T): Promise<T>;
  putMany<T extends { id: string }>(store: StoreName, items: T[]): Promise<void>;
  delete(store: StoreName, id: string): Promise<void>;
  clearAll(): Promise<void>;
  saveFileBlob(key: string, blob: Blob, fileName: string, mimeType: string): Promise<void>;
  getFileBlob(key: string): Promise<StoredFileBlob | undefined>;
  deleteFileBlob(key: string): Promise<void>;
}

const DB_NAME = 'icm_3d_marketplace_db';
const DB_VERSION = 1;
const STORES: StoreName[] = [
  'users',
  'equipments',
  'projects',
  'quotes',
  'orders',
  'messages',
  'notifications',
];
const BLOB_STORE = 'file_blobs';

export class IndexedDBStorageAdapter implements IStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  init(): Promise<void> {
    return this.openDb().then(() => undefined);
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getById<T>(store: StoreName, id: string): Promise<T | undefined> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T extends { id: string }>(store: StoreName, item: T): Promise<T> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  async putMany<T extends { id: string }>(store: StoreName, items: T[]): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      for (const item of items) {
        os.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(store: StoreName, id: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.openDb();
    const allStores = [...STORES, BLOB_STORE];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(allStores, 'readwrite');
      for (const name of allStores) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveFileBlob(
    key: string,
    blob: Blob,
    fileName: string,
    mimeType: string
  ): Promise<void> {
    const db = await this.openDb();
    const record: StoredFileBlob = {
      key,
      blob,
      fileName,
      mimeType,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      tx.objectStore(BLOB_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getFileBlob(key: string): Promise<StoredFileBlob | undefined> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const req = tx.objectStore(BLOB_STORE).get(key);
      req.onsuccess = () => resolve(req.result as StoredFileBlob | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFileBlob(key: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      tx.objectStore(BLOB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
