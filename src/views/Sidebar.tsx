import { Component, For, createSignal, Show } from "solid-js";
import { voiceStore } from "../store/voices";
import { appActions } from "../store";
import { dbClient } from "../db/client";
import { listReferences, addReference, deleteReference, renameReference } from "../lib/api";
import { HiOutlineMicrophone, HiOutlineSpeakerWave, HiOutlineArrowPath, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCloudArrowUp } from "solid-icons/hi";
import { cn } from "../lib/cn";

/**
 * §3: Granular reactivity — Sidebar shows voice library.
 * Voice list, upload, rename, delete operations.
 */
export const Sidebar: Component = () => {
  const [uploading, setUploading] = createSignal(false);
  const [newVoiceId, setNewVoiceId] = createSignal("");
  const [newVoiceText, setNewVoiceText] = createSignal("");
  const [audioFile, setAudioFile] = createSignal<File | null>(null);
  const [renamingId, setRenamingId] = createSignal<string | null>(null);
  const [renameValue, setRenameValue] = createSignal("");
  const [syncing, setSyncing] = createSignal(false);

  const handleSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      const serverIds = await listReferences();
      voiceStore.syncFromServer(serverIds);
      // Upsert each to local DB
      for (const id of serverIds) {
        const existing = voiceStore.get(id);
        await dbClient.upsertVoice(id, existing?.description || "");
      }
      appActions.showToast(`Synced ${serverIds.length} voices`);
    } catch (e) {
      appActions.showToast(`Sync failed: ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpload = async (): Promise<void> => {
    const id = newVoiceId().trim();
    const file = audioFile();
    const text = newVoiceText().trim();
    if (!id || !file) {
      appActions.showToast("Voice ID and audio file are required");
      return;
    }

    try {
      // Upload to server
      await addReference(id, file, text);
      // Add to local store + DB
      const voice = await dbClient.upsertVoice(id, text);
      voiceStore.add(voice);
      appActions.showToast(`Voice "${id}" uploaded`);
      // Reset form
      setNewVoiceId("");
      setNewVoiceText("");
      setAudioFile(null);
      setUploading(false);
    } catch (e) {
      appActions.showToast(`Upload failed: ${(e as Error).message}`);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm(`Delete voice "${id}"?`)) return;
    try {
      await deleteReference(id);
      voiceStore.remove(id);
      await dbClient.deleteVoice(id);
      appActions.showToast(`Voice "${id}" deleted`);
    } catch (e) {
      appActions.showToast(`Delete failed: ${(e as Error).message}`);
    }
  };

  const startRename = (id: string): void => {
    setRenamingId(id);
    setRenameValue(id);
  };

  const commitRename = async (): Promise<void> => {
    const oldId = renamingId();
    const newId = renameValue().trim();
    if (!oldId || !newId || oldId === newId) {
      setRenamingId(null);
      return;
    }
    try {
      await renameReference(oldId, newId);
      voiceStore.rename(oldId, newId);
      await dbClient.renameVoice(oldId, newId);
      appActions.showToast(`Renamed "${oldId}" → "${newId}"`);
    } catch (e) {
      appActions.showToast(`Rename failed: ${(e as Error).message}`);
    }
    setRenamingId(null);
  };

  return (
    <aside class="flex flex-col h-screen bg-surface-sidebar border-r border-border overflow-hidden">
      {/* Header */}
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <div class="flex items-center gap-2">
          <HiOutlineMicrophone class="w-5 h-5 text-accent" />
          <h1 class="text-sm font-semibold text-content-primary">Voices</h1>
        </div>
        <span class="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-accent/10 px-1.5 text-2xs font-medium text-accent">
          {voiceStore.all.length}
        </span>
      </div>

      {/* Action buttons */}
      <div class="flex items-center gap-2 px-4 py-2">
        <button
          class={cn("btn-secondary flex-1 text-xs", syncing() && "animate-pulse")}
          onClick={handleSync}
          disabled={syncing()}
        >
          <HiOutlineArrowPath class={cn("w-3.5 h-3.5", syncing() && "animate-spin")} />
          Sync
        </button>
        <button
          class="btn-primary flex-1 text-xs"
          onClick={() => setUploading(!uploading())}
        >
          <HiOutlinePlus class="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Upload form */}
      <Show when={uploading()}>
        <div class="mx-4 mb-2 p-3 rounded-lg border border-border bg-surface-primary space-y-2 animate-slide-down">
          <input
            type="text"
            placeholder="Voice ID..."
            value={newVoiceId()}
            onInput={(e) => setNewVoiceId(e.currentTarget.value)}
            class="input-field text-xs"
          />
          <input
            type="text"
            placeholder="Description text..."
            value={newVoiceText()}
            onInput={(e) => setNewVoiceText(e.currentTarget.value)}
            class="input-field text-xs"
          />
          <label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors duration-150">
            <HiOutlineCloudArrowUp class="w-4 h-4 text-content-tertiary" />
            <span class="text-xs text-content-secondary truncate">
              {audioFile()?.name || "Choose audio file..."}
            </span>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.currentTarget.files?.[0] || null)}
              class="sr-only"
            />
          </label>
          <button class="btn-primary w-full text-xs" onClick={handleUpload}>
            <HiOutlineCloudArrowUp class="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </Show>

      {/* Voice list */}
      <nav class="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <For each={voiceStore.all}>
          {(voice) => (
            <div
              class={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150",
                voiceStore.selectedId === voice.id
                  ? "bg-accent/10 text-accent"
                  : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
              )}
              onClick={() => voiceStore.select(voice.id)}
            >
              <Show
                when={renamingId() !== voice.id}
                fallback={
                  <input
                    class="input-field text-xs flex-1 py-1"
                    type="text"
                    value={renameValue()}
                    onInput={(e) => setRenameValue(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={commitRename}
                    autofocus
                  />
                }
              >
                <HiOutlineSpeakerWave class={cn(
                  "w-4 h-4 shrink-0",
                  voiceStore.selectedId === voice.id ? "text-accent" : "text-content-tertiary"
                )} />
                <span class="flex-1 text-sm truncate">{voice.id}</span>
                <div class="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    class="btn-icon !p-1"
                    onClick={() => startRename(voice.id)}
                    title="Rename"
                  >
                    <HiOutlinePencilSquare class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="btn-icon !p-1 hover:!text-red-500"
                    onClick={() => handleDelete(voice.id)}
                    title="Delete"
                  >
                    <HiOutlineTrash class="w-3.5 h-3.5" />
                  </button>
                </div>
              </Show>
            </div>
          )}
        </For>
      </nav>

      {/* Footer */}
      <div class="flex items-center justify-center px-4 py-3 border-t border-border">
        <span class="flex items-center gap-1.5 text-2xs text-content-tertiary">
          <kbd class="kbd">⌘K</kbd>
          <span>search history</span>
        </span>
      </div>
    </aside>
  );
};
