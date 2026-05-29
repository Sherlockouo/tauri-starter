/* @refresh reload */
import { render } from "solid-js/web";
import { App } from "./App";
import { hydrateStore } from "./store";
import { dbClient } from "./db/client";
import { syncEngine } from "./sync/engine";
import { registerShortcuts } from "./shortcuts";
import "./styles/tailwind.css";

/**
 * §1: Bootstrap Sequence
 * Shell paint → DB open → hydrate store → render → start sync
 */
async function bootstrap(): Promise<void> {
  // Phase 1: Shell visible via inlined HTML/CSS (see index.html)

  // Phase 2: Open local database via Tauri Rust backend
  performance.mark("db-open-start");
  await dbClient.initialize();
  performance.mark("db-open-end");
  performance.measure("db-open", "db-open-start", "db-open-end");

  // Phase 3: Hydrate reactive store from local DB
  performance.mark("hydrate-start");
  const [voices, history] = await Promise.all([
    dbClient.listVoices(),
    dbClient.listHistory(),
  ]);
  hydrateStore(voices, history);
  performance.mark("hydrate-end");
  performance.measure("hydrate", "hydrate-start", "hydrate-end");

  // Phase 4: Render
  performance.mark("render-start");
  const root = document.getElementById("app");
  if (!root) throw new Error("Root element #app not found");
  render(() => <App />, root);
  performance.mark("first-render");
  performance.measure("render", "render-start", "first-render");

  // Phase 4.1: Remove static shell skeleton now that the app has rendered
  const shell = document.getElementById("shell");
  if (shell) shell.remove();

  // Phase 5: Start background sync AFTER render
  syncEngine.start();

  // §7: Keyboard-First — register global shortcuts after render
  registerShortcuts();

  if (import.meta.env.DEV) {
    const entries = performance.getEntriesByType("measure");
    console.groupCollapsed("[perf] Bootstrap timing");
    for (const entry of entries) {
      console.log(`  ${entry.name}: ${entry.duration.toFixed(1)}ms`);
    }
    console.groupEnd();
  }
}

bootstrap().catch((err) => {
  console.error("[bootstrap] Fatal error:", err);
});
