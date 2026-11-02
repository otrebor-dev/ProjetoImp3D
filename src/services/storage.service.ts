import {
  IndexedDBStorageAdapter,
  IStorageAdapter,
  StoredFileBlob,
  StoreName,
} from './storage.adapter';

const SESSION_KEY = 'icm_active_session_v1';
const SEED_FLAG_KEY = 'icm_demo_seeded_v1';
const SYNC_CHANNEL = 'icm_marketplace_sync_v1';

type ChangeListener = () => void;

class StorageServiceImpl {
  private adapter: IStorageAdapter;
  private listeners = new Set<ChangeListener>();
  private channel: BroadcastChannel | null = null;

  constructor(adapter: IStorageAdapter) {
    this.adapter = adapter;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL);
      this.channel.onmessage = () => {
        this.notifyLocalListeners();
      };
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SESSION_KEY || e.key === SEED_FLAG_KEY) {
          this.notifyLocalListeners();
        }
      });
    }
  }

  async init(): Promise<void> {
    await this.adapter.init();
  }

  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyChange(): void {
    this.notifyLocalListeners();
    try {
      this.channel?.postMessage({ ts: Date.now() });
    } catch {
      // Ignora em contextos onde BroadcastChannel esteja indisponível
    }
  }

  private notifyLocalListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getSessionUserId(): string | null {
    return localStorage.getItem(SESSION_KEY);
  }

  setSessionUserId(userId: string | null): void {
    if (userId) {
      localStorage.setItem(SESSION_KEY, userId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    this.notifyChange();
  }

  isSeeded(): boolean {
    return localStorage.getItem(SEED_FLAG_KEY) === 'true';
  }

  markSeeded(value: boolean): void {
    if (value) {
      localStorage.setItem(SEED_FLAG_KEY, 'true');
    } else {
      localStorage.removeItem(SEED_FLAG_KEY);
    }
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    return this.adapter.getAll<T>(store);
  }

  async getById<T>(store: StoreName, id: string): Promise<T | undefined> {
    return this.adapter.getById<T>(store, id);
  }

  async put<T extends { id: string }>(store: StoreName, item: T): Promise<T> {
    const saved = await this.adapter.put<T>(store, item);
    this.notifyChange();
    return saved;
  }

  async putMany<T extends { id: string }>(store: StoreName, items: T[]): Promise<void> {
    await this.adapter.putMany<T>(store, items);
    this.notifyChange();
  }

  async delete(store: StoreName, id: string): Promise<void> {
    await this.adapter.delete(store, id);
    this.notifyChange();
  }

  async saveFileBlob(
    key: string,
    blob: Blob,
    fileName: string,
    mimeType: string
  ): Promise<void> {
    await this.adapter.saveFileBlob(key, blob, fileName, mimeType);
  }

  async getFileBlob(key: string): Promise<StoredFileBlob | undefined> {
    return this.adapter.getFileBlob(key);
  }

  async deleteFileBlob(key: string): Promise<void> {
    await this.adapter.deleteFileBlob(key);
  }

  async clearAllData(): Promise<void> {
    await this.adapter.clearAll();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SEED_FLAG_KEY);
    this.notifyChange();
  }
}

export const StorageService = new StorageServiceImpl(new IndexedDBStorageAdapter());
