import { Component, createSignal, createEffect, For, onMount } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { appActions } from "../store";
import { historyStore } from "../store/history";
import type { HistoryEntry } from "../store/history";
import { HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from "solid-icons/hi";
import { cn } from "../lib/cn";

/**
 * §7: Keyboard-First — Command Palette
 * Searches history entries. §4: Lazily loaded.
 */

function searchHistory(query: string, limit: number = 20): HistoryEntry[] {
  if (!query.trim()) return historyStore.all.slice(0, limit);
  const lower = query.toLowerCase();
  const results: HistoryEntry[] = [];
  for (const entry of historyStore.all) {
    if (entry.text.toLowerCase().includes(lower) ||
        (entry.voice_id && entry.voice_id.toLowerCase().includes(lower))) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

const CommandPalette: Component = () => {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<HistoryEntry[]>([]);
  const [selectedIdx, setSelectedIdx] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    inputRef?.focus();
    setResults(historyStore.all.slice(0, 20));
  });

  createEffect(() => {
    const q = query();
    const found = searchHistory(q);
    setResults(found);
    setSelectedIdx(0);
  });

  const handleKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results().length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        appActions.closeCommandPalette();
        break;
      case "Escape":
        appActions.closeCommandPalette();
        break;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) appActions.closeCommandPalette(); }}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content class="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 animate-scale-in">
          <div class="rounded-xl border border-border bg-surface-elevated shadow-elevated overflow-hidden">
            {/* Search input */}
            <div class="flex items-center gap-3 px-4 border-b border-border">
              <HiOutlineMagnifyingGlass class="w-5 h-5 text-content-tertiary shrink-0" />
              <input
                ref={inputRef}
                class="flex-1 bg-transparent py-3.5 text-sm text-content-primary placeholder:text-content-tertiary outline-none"
                type="text"
                placeholder="Search history... (↑↓ to navigate, Esc to close)"
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
              />
              <kbd class="kbd text-2xs">ESC</kbd>
            </div>

            {/* Results */}
            <div class="max-h-[320px] overflow-y-auto p-2">
              <For each={results()}>
                {(entry, idx) => (
                  <div
                    class={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100",
                      idx() === selectedIdx()
                        ? "bg-accent/10 text-accent"
                        : "text-content-primary hover:bg-surface-secondary"
                    )}
                  >
                    {/* Status icon */}
                    <div class="shrink-0">
                      {entry.status === "done" ? (
                        <HiOutlineCheckCircle class="w-4 h-4 text-emerald-500" />
                      ) : entry.status === "failed" ? (
                        <HiOutlineXCircle class="w-4 h-4 text-red-500" />
                      ) : (
                        <HiOutlineClock class="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div class="flex-1 min-w-0">
                      <p class="text-sm truncate">
                        {entry.text.slice(0, 60)}{entry.text.length > 60 ? "..." : ""}
                      </p>
                    </div>

                    {/* Voice badge */}
                    {entry.voice_id && (
                      <span class="shrink-0 rounded-md bg-surface-secondary px-2 py-0.5 text-2xs font-medium text-content-tertiary">
                        {entry.voice_id}
                      </span>
                    )}
                  </div>
                )}
              </For>

              {/* Empty state */}
              {results().length === 0 && (
                <div class="py-8 text-center">
                  <p class="text-sm text-content-tertiary">No results found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div class="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-surface-secondary/50">
              <span class="flex items-center gap-1 text-2xs text-content-tertiary">
                <kbd class="kbd">↑↓</kbd> navigate
              </span>
              <span class="flex items-center gap-1 text-2xs text-content-tertiary">
                <kbd class="kbd">↵</kbd> select
              </span>
              <span class="flex items-center gap-1 text-2xs text-content-tertiary">
                <kbd class="kbd">esc</kbd> close
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

export default CommandPalette;
