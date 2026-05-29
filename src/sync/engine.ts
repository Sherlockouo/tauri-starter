import { syncQueue } from "./queue";
import { appActions } from "../store";

/**
 * §9: Sync Engine — Simplified for TTS Workshop
 *
 * TTS Workshop is primarily local-first with an external API.
 * The sync queue handles any failed DB persistence with rollback.
 * No server-push deltas needed — the TTS server is stateless from our perspective.
 */

class SyncEngine {
  private started = false;

  /**
   * §1: Start AFTER render — sync is Phase 5 of bootstrap.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    // §2: Register rollback toast handler on sync queue
    syncQueue.onOperationFailed((op, _error) => {
      appActions.showToast(
        `Failed to sync ${op.entity} ${op.type}. Change reverted.`
      );
    });
  }

  stop(): void {
    this.started = false;
  }
}

/** Singleton sync engine */
export const syncEngine = new SyncEngine();
