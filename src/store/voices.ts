import { createStore, produce } from "solid-js/store";
import { createSignal } from "solid-js";

/**
 * §3: Granular Reactive State — Voice store
 * Voices are relatively few (<50), held entirely in reactive store.
 * Mirrors server voice list + local descriptions.
 */

export interface Voice {
  id: string;
  description: string;
  created_at: string;
}

const [voices, setVoices] = createStore<Voice[]>([]);
const [selectedVoiceId, setSelectedVoiceId] = createSignal<string | null>(null);

export function hydrateVoices(data: Voice[]): void {
  setVoices(data);
}

export const voiceStore = {
  get all() { return voices; },

  get selectedId() { return selectedVoiceId(); },

  get(id: string): Voice | undefined {
    return voices.find((v) => v.id === id);
  },

  select(id: string | null): void {
    setSelectedVoiceId(id);
  },

  // §2: Optimistic mutations
  add(voice: Voice): void {
    setVoices(produce((draft) => { draft.push(voice); }));
  },

  remove(id: string): void {
    setVoices((prev) => prev.filter((v) => v.id !== id));
    if (selectedVoiceId() === id) {
      setSelectedVoiceId(null);
    }
  },

  rename(oldId: string, newId: string): void {
    setVoices(
      (v) => v.id === oldId,
      "id",
      newId
    );
    if (selectedVoiceId() === oldId) {
      setSelectedVoiceId(newId);
    }
  },

  updateDescription(id: string, description: string): void {
    setVoices(
      (v) => v.id === id,
      "description",
      description
    );
  },

  /** Sync from server list — add missing, keep descriptions for existing */
  syncFromServer(serverIds: string[]): void {
    const existing = new Set(voices.map((v) => v.id));
    const serverSet = new Set(serverIds);

    // Add new voices from server
    for (const id of serverIds) {
      if (!existing.has(id)) {
        setVoices(produce((draft) => {
          draft.push({ id, description: "", created_at: new Date().toISOString() });
        }));
      }
    }

    // Remove voices no longer on server
    setVoices((prev) => prev.filter((v) => serverSet.has(v.id)));
  },
};
