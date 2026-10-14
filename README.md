# Dashboard Template — Tauri

Feature-rich admin dashboard starter built on **Tauri 2 + React 19 + HeroUI v3 + Zustand + sqlx (SQLite)**.

The UI is a complete dashboard template: collapsible sidebar, ⌘K command palette, KPI cards with sparklines, hand-rolled SVG charts (area / bars / donut), a sortable + searchable + paginated orders table, activity feed, customer management (drawer, modal form, filters), settings with theme switching, and toasts — all themed by [HeroUI v3](https://heroui.com) with light/dark mode.

## Launch

```bash
cd templates/tauri-template
pnpm install                 # one time
pnpm tauri dev               # Vite dev server + native window (Rust compiles on first run)
```

`pnpm tauri build` produces platform bundles in `src-tauri/target/release/bundle/`.

The renderer also runs standalone in a plain browser (`pnpm dev`) — the data layer falls back to deterministic in-memory mock data when the Tauri IPC layer is absent.

## Architecture

```
src/
  data/              Types + deterministic mock dataset (browser fallback)
  lib/               platform.ts bridge (invoke ⇄ mock), formatters, cn()
  store/             Zustand stores (UI state, dashboard snapshot)
  charts/            Dependency-free SVG charts (useMeasure for responsiveness)
  components/        Dashboard widgets + app shell
  views/             Overview / Analytics / Customers / Settings pages
src-tauri/
  src/db.rs          sqlx pool, WAL, migrations + seeded metrics table
  src/commands.rs    get_metrics + get_app_info commands
  src/main.rs        Setup, plugin registration, command handlers
```

### HeroUI v3 setup (quick start)

```css
/* src/styles/tailwind.css */
@import "tailwindcss";   /* order matters — tailwindcss first */
@import "@heroui/styles";
```

No provider is required. Dark mode is CSS-driven: `useTheme()` from `@heroui/react` sets `class` + `data-theme` on `<html>` and persists to `localStorage["heroui-theme"]` (mirrored by an inline bootstrap script in `index.html` to avoid FOUC). Toasts use the imperative `toast()` API plus a single `<Toast.Provider />` mounted in `src/main.tsx`.

### Live mode

The dashboard drives itself: every 2.5s a new day of metrics is generated (mean-reverting around realistic anchors) and activity/notification events stream in — no interaction or refresh needed. A pulsing "Live" badge sits next to the revenue chart's range tabs; turn it off in **Settings → Live data** if you want a static snapshot.

### Data flow

1. Renderer mounts and calls `hydrate()` (Zustand).
2. `loadSnapshot()` invokes the Rust `get_metrics` command when running under Tauri; otherwise it uses the bundled mock generator.
3. Charts and tables derive everything from the single `DashboardSnapshot`.

### Conventions

- Local-first: SQLite lives in the Rust process; the UI never waits on network.
- Commands are explicit and typed (`get_metrics`, `get_app_info`) — extend with your domain.
- Components are React Aria-based — use `onPress`, never `onClick`.
- Theme through semantic tokens (`bg-surface`, `text-muted`, `var(--accent)`), never hard-coded colors — dark mode comes for free.
