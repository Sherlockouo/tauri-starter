# TTS Workshop — Tauri

Local-first desktop app for the Fish Speech TTS service, built on Tauri 2 + Solid.js + SQLite.

## Launch

```bash
cd templates/tauri-template
pnpm install                 # one time
pnpm tauri dev               # opens native window
```

`pnpm tauri build` produces `.app`/`.dmg` in `src-tauri/target/release/bundle/`.

The first `pnpm tauri dev` will compile Rust dependencies — expect a few minutes. Subsequent builds are fast.

## Layout

```
┌─────────────┬─────────────────────────┬──────────────┐
│ Sidebar     │ TTSPanel                │ HistoryPanel │
│ (voices)    │ (Single / Batch tabs)   │ (history)    │
└─────────────┴─────────────────────────┴──────────────┘
```

## Features

| Feature           | File                                                 |
| ----------------- | ---------------------------------------------------- |
| Voice CRUD        | `src/views/Sidebar.tsx`                              |
| Single TTS        | `src/views/TTSPanel.tsx` → `SingleMode`              |
| Batch TTS         | `src/views/TTSPanel.tsx` → `BatchMode`               |
| History           | `src/views/HistoryPanel.tsx`                         |
| Command palette   | `src/views/CommandPalette.tsx` (Cmd/Ctrl+K)          |
| Server API client | `src/lib/api.ts`                                     |
| Tauri commands    | `src-tauri/src/commands.rs` (DB + audio file I/O)    |

## Configuration

- **TTS server URL** — `src/lib/api.ts` → `TTS_BASE_URL` (currently `http://192.168.1.246:8080`)
- **Audio storage** — Tauri app data dir, resolved via `app.path().app_data_dir() + /audio` (see `src-tauri/src/db.rs::get_audio_dir`)
- **SQLite path** — same app data dir, file `tts-workshop.db`

## Keyboard

- `⌘K` / `Ctrl+K` — command palette (search history)
- `1` / `2` — switch Single / Batch tab
- `Esc` — close palette

## Architecture notes

- `§1` Bootstrap: shell paint → `db.initialize` → `listVoices/listHistory` → render → register shortcuts
- `§3` Reactive state: per-store Solid signals (`voiceStore`, `historyStore`) for granular reactivity
- `§4` Code splitting: `CommandPalette` is lazy
- `§9` SyncEngine: simplified — TTS server is stateless from our side; only the `syncQueue` rollback toast handler is wired
- `§11` IPC: all DB and audio file work goes through Tauri `invoke` commands declared in `src/db/client.ts`
