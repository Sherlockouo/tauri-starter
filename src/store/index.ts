import { createSignal } from "solid-js";
import { voiceStore, hydrateVoices } from "./voices";
import { historyStore, hydrateHistory } from "./history";
import type { Voice } from "./voices";
import type { HistoryEntry } from "./history";

export type { Voice, HistoryEntry };

/**
 * §3: Granular Reactive State
 * App-level state using Solid.js signals for per-property observability.
 */

// Global app state signals
const [commandPaletteOpen, setCommandPaletteOpen] = createSignal(false);
const [toastMessage, setToastMessage] = createSignal<string | null>(null);
const [activeTab, setActiveTab] = createSignal<"single" | "batch">("single");

export const appState = {
  get commandPaletteOpen() { return commandPaletteOpen(); },
  get toastMessage() { return toastMessage(); },
  get activeTab() { return activeTab(); },
};

export const appActions = {
  openCommandPalette: () => setCommandPaletteOpen(true),
  closeCommandPalette: () => setCommandPaletteOpen(false),
  toggleCommandPalette: () => setCommandPaletteOpen((v) => !v),
  setActiveTab: (tab: "single" | "batch") => setActiveTab(tab),
  showToast: (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  },
};

/**
 * §1: Hydrate reactive store from local DB during bootstrap.
 * Called once after DB query, before render. No loading states needed.
 */
export function hydrateStore(voices: Voice[], history: HistoryEntry[]): void {
  hydrateVoices(voices);
  hydrateHistory(history);
}

export { voiceStore, historyStore };
