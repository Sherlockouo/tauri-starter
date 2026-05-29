/**
 * §9: Sync Engine — SyncQueue with retry, rollback, and IndexedDB persistence
 *
 * Operations flow: User action → store update → local DB → SyncQueue → server
 * On failure after max retries: rollback store + local DB, show toast.
 * Queue persisted via requestIdleCallback to avoid blocking main thread.
 */

export interface SyncOperation {
  id: string;
  timestamp: number;
  type: "create" | "update" | "delete";
  entity: string;
  payload: Record<string, unknown>;
  rollback: () => void;
  retries: number;
}

// Serializable version (no rollback function)
interface PersistedOperation {
  id: string;
  timestamp: number;
  type: "create" | "update" | "delete";
  entity: string;
  payload: Record<string, unknown>;
  retries: number;
}

const MAX_RETRIES = 3;
const DB_NAME = "sync-queue";
const STORE_NAME = "queue";

export class SyncQueue {
  private queue: SyncOperation[] = [];
  private processing = false;
  private onFailure: ((op: SyncOperation, error: unknown) => void) | null = null;

  constructor() {
    this.restoreQueue();
  }

  /** Register failure handler (typically shows toast with rollback info) */
  onOperationFailed(handler: (op: SyncOperation, error: unknown) => void): void {
    this.onFailure = handler;
  }

  /** §2: Push optimistic operation to sync queue */
  push(op: SyncOperation): void {
    this.queue.push(op);
    this.persistQueue();
    this.flush();
  }

  /** Process queue — sequential, with exponential backoff */
  private async flush(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const op = this.queue[0];
      try {
        await this.sendToServer(op);
        this.queue.shift();
        this.persistQueue();
      } catch (e) {
        op.retries++;
        if (op.retries > MAX_RETRIES) {
          // §2: Rollback on permanent failure
          op.rollback();
          this.queue.shift();
          this.persistQueue();
          this.onFailure?.(op, e);
        } else {
          await this.backoff(op.retries);
        }
      }
    }

    this.processing = false;
  }

  /**
   * §9: Send to server — placeholder for actual HTTP/WebSocket sync.
   * In this template, simulates a server that's always "available" (local-first).
   * Replace with actual API calls in production.
   */
  private async sendToServer(_op: SyncOperation): Promise<void> {
    // Simulate network latency in dev
    if (import.meta.env.DEV) {
      await new Promise((r) => setTimeout(r, 50));
    }
    // In production: POST to server API
    // await fetch('/api/sync', { method: 'POST', body: JSON.stringify(op) });
  }

  /** Exponential backoff: 1s, 2s, 4s, max 30s */
  private backoff(retries: number): Promise<void> {
    const delay = Math.min(1000 * 2 ** retries, 30000);
    return new Promise((r) => setTimeout(r, delay));
  }

  /**
   * §9: Persist queue via requestIdleCallback to stay within 16ms frame budget.
   * Uses IndexedDB for durability across app restarts.
   */
  private persistQueue(): void {
    const data: PersistedOperation[] = this.queue.map(
      ({ rollback: _rollback, ...rest }) => rest
    );

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => this.writeToIndexedDB(data));
    } else {
      // Fallback for environments without requestIdleCallback
      setTimeout(() => this.writeToIndexedDB(data), 0);
    }
  }

  private writeToIndexedDB(data: PersistedOperation[]): void {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(data, "pending");
      db.close();
    };
  }

  /** Restore persisted queue on app restart (operations without rollback are no-ops) */
  private restoreQueue(): void {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const getReq = tx.objectStore(STORE_NAME).get("pending");
      getReq.onsuccess = () => {
        const ops = getReq.result as PersistedOperation[] | undefined;
        if (ops && ops.length > 0) {
          // Restored ops have no rollback — they'll just fail silently on max retries
          this.queue = ops.map((op) => ({ ...op, rollback: () => {} }));
          this.flush();
        }
      };
      db.close();
    };
  }

  /** Utility: generate unique operation ID */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** Singleton sync queue instance */
export const syncQueue = new SyncQueue();
