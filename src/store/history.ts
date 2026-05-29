import { createStore, produce } from "solid-js/store";
import { createSignal } from "solid-js";

/**
 * §3: Granular Reactive State — History store
 * Tracks all TTS generation attempts with status, audio paths, and params.
 */

export type HistoryStatus = "pending" | "done" | "failed";

export interface HistoryEntry {
  id: string;
  text: string;
  params: string; // JSON string of TTS params
  audio_path: string | null;
  voice_id: string | null;
  created_at: string;
  status: HistoryStatus;
  error: string | null;
}

const [history, setHistory] = createStore<HistoryEntry[]>([]);
const [historyCount, setHistoryCount] = createSignal(0);

export function hydrateHistory(data: HistoryEntry[]): void {
  setHistory(data);
  setHistoryCount(data.length);
}

export const historyStore = {
  get all() { return history; },
  get count() { return historyCount(); },

  get(id: string): HistoryEntry | undefined {
    return history.find((h) => h.id === id);
  },

  // §2: Optimistic — add entry immediately (status=pending)
  add(entry: HistoryEntry): void {
    setHistory(produce((draft) => { draft.unshift(entry); }));
    setHistoryCount((c) => c + 1);
  },

  // Update status after TTS completes or fails
  updateStatus(id: string, status: HistoryStatus, audioPath?: string | null, error?: string | null): void {
    const idx = history.findIndex((h) => h.id === id);
    if (idx === -1) return;
    setHistory(idx, "status", status);
    if (audioPath !== undefined) {
      setHistory(idx, "audio_path", audioPath);
    }
    if (error !== undefined) {
      setHistory(idx, "error", error);
    }
  },

  remove(id: string): void {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    setHistoryCount((c) => c - 1);
  },
};
