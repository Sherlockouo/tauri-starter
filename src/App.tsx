import { Component, Show, lazy, Suspense } from "solid-js";
import { Sidebar } from "./views/Sidebar";
import { TTSPanel } from "./views/TTSPanel";
import { HistoryPanel } from "./views/HistoryPanel";
import { appState } from "./store";

// §4: Code Splitting — CommandPalette loaded lazily (only when Cmd+K pressed)
const CommandPalette = lazy(() => import("./views/CommandPalette"));

/**
 * §5: Three-column shell — Sidebar (voices) · Main (TTS) · History.
 */
export const App: Component = () => {
  return (
    <div class="grid grid-cols-[260px_1fr_320px] h-screen w-screen overflow-hidden">
      <Sidebar />
      <main class="flex flex-col overflow-hidden bg-surface-primary">
        <TTSPanel />
      </main>
      <HistoryPanel />

      {/* §4: Lazy-loaded command palette — only in DOM when open */}
      <Show when={appState.commandPaletteOpen}>
        <Suspense>
          <CommandPalette />
        </Suspense>
      </Show>

      {/* Toast */}
      <Show when={appState.toastMessage}>
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div class="rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-content-primary shadow-elevated backdrop-blur-sm">
            {appState.toastMessage}
          </div>
        </div>
      </Show>
    </div>
  );
};
