/**
 * Platform bridge — resolves dashboard data from the best available source:
 * 1. Tauri Rust backend (SQLite via sqlx, invoked over IPC)
 * 2. In-memory mock data (plain `vite` dev server / pure browser)
 */
import { invoke } from "@tauri-apps/api/core";
import { buildKpis, buildMockSnapshot } from "../data/mock";
import type { DashboardSnapshot, MetricPoint } from "../data/types";

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  tauri: string;
  webview: string;
}

interface MetricRow {
  date: string;
  revenue: number;
  users: number;
  orders: number;
}

/** Detect the Tauri IPC layer without importing Tauri internals. */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function rowToMetric(row: MetricRow): MetricPoint {
  return {
    date: row.date,
    revenue: Number(row.revenue),
    users: Number(row.users),
    orders: Number(row.orders),
  };
}

/** Load the dashboard snapshot, preferring the desktop SQLite database. */
export async function loadSnapshot(): Promise<DashboardSnapshot> {
  const snapshot = buildMockSnapshot();

  if (isTauri()) {
    try {
      const rows = await invoke<MetricRow[]>("get_metrics");
      if (Array.isArray(rows) && rows.length > 0) {
        const metrics = rows.map(rowToMetric);
        snapshot.metrics = metrics;
        snapshot.kpis = buildKpis(metrics);
      }
    } catch (err) {
      console.warn("[platform] DB unavailable, using mock metrics:", err);
    }
  }

  return snapshot;
}

/** Static app info; null in the plain browser. */
export async function loadAppInfo(): Promise<AppInfo | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<AppInfo>("get_app_info");
  } catch {
    return null;
  }
}

/** True when running inside the Tauri shell. */
export function isDesktop(): boolean {
  return isTauri();
}
