import { Component, For, Show, createSignal } from "solid-js";
import { historyStore, type HistoryEntry } from "../store/history";
import { appActions } from "../store";
import { dbClient } from "../db/client";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { HiOutlinePlay, HiOutlineTrash, HiOutlineFolderArrowDown, HiOutlineClock, HiOutlineMusicalNote } from "solid-icons/hi";
import { cn } from "../lib/cn";

/**
 * History Panel — right sidebar showing all TTS generation history.
 * Each entry shows text preview, status, and playback controls.
 */
export const HistoryPanel: Component = () => {
  const [playingId, setPlayingId] = createSignal<string | null>(null);
  const [exporting, setExporting] = createSignal(false);

  const handlePlay = (entry: HistoryEntry): void => {
    if (!entry.audio_path) return;
    setPlayingId(entry.id);
  };

  const handleDelete = async (id: string): Promise<void> => {
    historyStore.remove(id);
    await dbClient.deleteHistory(id);
  };

  const handleExport = async (): Promise<void> => {
    // Use Tauri dialog to pick directory
    const targetDir = await open({
      directory: true,
      title: "Select export directory",
    });

    if (!targetDir) return;

    setExporting(true);
    let copied = 0;

    try {
      const doneEntries = historyStore.all.filter((h) => h.status === "done" && h.audio_path);
      for (const entry of doneEntries) {
        if (!entry.audio_path) continue;
        const ext = entry.audio_path.split(".").pop() || "mp3";
        const filename = `tts_${entry.id}.${ext}`;
        await dbClient.copyAudioToDir(entry.audio_path, targetDir as string, filename);
        copied++;
      }
      appActions.showToast(`Exported ${copied} audio files`);
    } catch (e) {
      appActions.showToast(`Export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-emerald-500";
      case "failed": return "bg-red-500";
      default: return "bg-amber-500 animate-pulse";
    }
  };

  return (
    <aside class="flex flex-col h-screen bg-surface-sidebar border-l border-border overflow-hidden">
      {/* Header */}
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <div class="flex items-center gap-2">
          <HiOutlineClock class="w-5 h-5 text-content-secondary" />
          <h2 class="text-sm font-semibold text-content-primary">History</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-content-tertiary/10 px-1.5 text-2xs font-medium text-content-secondary">
            {historyStore.count}
          </span>
          <button
            class="btn-ghost text-xs"
            onClick={handleExport}
            disabled={exporting()}
            title="Export all audio to folder"
          >
            <HiOutlineFolderArrowDown class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History list */}
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <For each={historyStore.all}>
          {(entry) => (
            <div
              class={cn(
                "group rounded-lg border border-border bg-surface-primary p-3 transition-all duration-150 hover:border-border hover:shadow-subtle",
                playingId() === entry.id && "ring-1 ring-accent/30 border-accent/30"
              )}
            >
              {/* Header row */}
              <div class="flex items-center gap-2 mb-1.5">
                <span class={cn("w-2 h-2 rounded-full shrink-0", statusColor(entry.status))} />
                <span class="text-2xs font-medium text-content-tertiary truncate flex-1">
                  {entry.voice_id || "default"}
                </span>
                <button
                  class="btn-icon !p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:!text-red-500"
                  onClick={() => handleDelete(entry.id)}
                  title="Delete"
                >
                  <HiOutlineTrash class="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text preview */}
              <p class="text-xs text-content-primary leading-relaxed line-clamp-2 mb-2">
                {entry.text.slice(0, 80)}{entry.text.length > 80 ? "..." : ""}
              </p>

              {/* Error */}
              <Show when={entry.status === "failed" && entry.error}>
                <div class="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-1 mb-2">
                  <p class="text-2xs text-red-400 line-clamp-2">{entry.error}</p>
                </div>
              </Show>

              {/* Audio player */}
              <Show when={entry.status === "done" && entry.audio_path}>
                <div class="mt-1">
                  <Show
                    when={playingId() === entry.id}
                    fallback={
                      <button
                        class="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1 text-2xs font-medium text-accent hover:bg-accent/20 transition-colors duration-150"
                        onClick={() => handlePlay(entry)}
                      >
                        <HiOutlinePlay class="w-3 h-3" />
                        Play
                      </button>
                    }
                  >
                    <audio
                      controls
                      src={convertFileSrc(entry.audio_path!)}
                      onEnded={() => setPlayingId(null)}
                      autoplay
                      class="w-full h-8 rounded"
                    />
                  </Show>
                </div>
              </Show>

              {/* Timestamp */}
              <div class="flex items-center gap-1 mt-2 pt-1.5 border-t border-border-subtle">
                <span class="text-2xs text-content-tertiary">
                  {new Date(entry.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </For>

        {/* Empty state */}
        <Show when={historyStore.all.length === 0}>
          <div class="flex flex-col items-center justify-center py-12 px-4">
            <div class="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mb-3">
              <HiOutlineMusicalNote class="w-6 h-6 text-content-tertiary" />
            </div>
            <p class="text-sm font-medium text-content-secondary mb-1">No history yet</p>
            <p class="text-xs text-content-tertiary text-center">
              Generate some TTS and your history will appear here.
            </p>
          </div>
        </Show>
      </div>
    </aside>
  );
};
