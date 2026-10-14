/** Dashboard data store — hydrated from the platform bridge, then self-updating. */
import { create } from "zustand";
import { buildKpis, nextMetricPoint } from "../data/mock";
import { loadAppInfo, loadSnapshot, type AppInfo } from "../lib/platform";
import type { ActivityItem, AppNotification, DashboardSnapshot } from "../data/types";

interface DashboardState {
  status: "loading" | "ready" | "error";
  snapshot: DashboardSnapshot | null;
  appInfo: AppInfo | null;
  readNotificationIds: string[];
  live: boolean;
  tickCount: number;
  markNotificationsRead: () => void;
  setLive: (live: boolean) => void;
  /** Advance the series by one day and stream in fresh activity — called on a timer. */
  tick: () => void;
  hydrate: () => Promise<void>;
}

const ACTIVITY_POOL: Array<Omit<ActivityItem, "id" | "minutesAgo">> = [
  { type: "sale", actor: "Ava Chen", action: "purchased", target: "Vertex Analytics" },
  { type: "sale", actor: "Owen Rossi", action: "purchased", target: "Scale Infrastructure" },
  { type: "user", actor: "Ivy Okafor", action: "upgraded to", target: "Pro plan" },
  { type: "user", actor: "Felix Weber", action: "invited", target: "3 teammates" },
  { type: "refund", actor: "Support Bot", action: "auto-refunded", target: "a failed order" },
  { type: "system", actor: "Billing", action: "recovered", target: "a failed payment" },
];

const NOTIFICATION_POOL: Array<Omit<AppNotification, "id" | "minutesAgo" | "read">> = [
  { title: "New order received", description: "A customer just checked out.", variant: "success" },
  { title: "Traffic spike detected", description: "Sessions are up 18% in the last hour.", variant: "accent" },
  { title: "Nightly backup finished", description: "Snapshot stored in the primary region.", variant: "default" },
];

export const useDashboard = create<DashboardState>((set, get) => ({
  status: "loading",
  snapshot: null,
  appInfo: null,
  readNotificationIds: [],
  live: true,
  tickCount: 0,
  markNotificationsRead: () =>
    set((s) => ({
      readNotificationIds: (s.snapshot?.notifications ?? []).map((n) => n.id),
    })),
  setLive: (live) => set({ live }),
  tick: () => {
    const s = get();
    if (s.status !== "ready" || !s.snapshot) return;

    const last = s.snapshot.metrics[s.snapshot.metrics.length - 1];
    const metrics = [...s.snapshot.metrics, nextMetricPoint(last)].slice(-181);
    const tickCount = s.tickCount + 1;

    let activity = s.snapshot.activity;
    let notifications = s.snapshot.notifications;
    if (tickCount % 3 === 0) {
      const entry = ACTIVITY_POOL[tickCount % ACTIVITY_POOL.length];
      activity = [{ ...entry, id: `live-${tickCount}`, minutesAgo: 0 }, ...activity].slice(0, 10);
    }
    if (tickCount % 5 === 0) {
      const entry = NOTIFICATION_POOL[tickCount % NOTIFICATION_POOL.length];
      notifications = [
        { ...entry, id: `live-ntf-${tickCount}`, minutesAgo: 0, read: false },
        ...notifications,
      ].slice(0, 8);
    }

    set({
      tickCount,
      snapshot: { ...s.snapshot, metrics, kpis: buildKpis(metrics), activity, notifications },
    });
  },
  hydrate: async () => {
    try {
      // Small delay so the skeleton loading state is visible in dev.
      const [snapshot, appInfo] = await Promise.all([
        loadSnapshot(),
        loadAppInfo(),
        new Promise((r) => setTimeout(r, 450)),
      ]);
      set({
        status: "ready",
        snapshot: snapshot as DashboardSnapshot,
        appInfo: appInfo as AppInfo | null,
      });
    } catch (err) {
      console.error("[dashboard] Failed to hydrate:", err);
      set({ status: "error" });
    }
  },
}));
