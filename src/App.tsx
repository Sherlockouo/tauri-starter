/**
 * App shell — collapsible sidebar + topbar + active page.
 * Platform content lives behind the platform bridge (Electron SQLite / mock).
 */
import { useEffect } from "react";
import { Sidebar } from "./components/app-shell/Sidebar";
import { Topbar } from "./components/app-shell/Topbar";
import { CommandPalette } from "./components/app-shell/CommandPalette";
import { AddCustomerModal } from "./components/AddCustomerModal";
import { OverviewPage } from "./views/OverviewPage";
import { AnalyticsPage } from "./views/AnalyticsPage";
import { CustomersPage } from "./views/CustomersPage";
import { SettingsPage } from "./views/SettingsPage";
import { useUi } from "./store/ui";
import { useDashboard } from "./store/dashboard";

export default function App() {
  const page = useUi((s) => s.page);
  const commandOpen = useUi((s) => s.commandOpen);
  const addCustomerOpen = useUi((s) => s.addCustomerOpen);
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const hydrate = useDashboard((s) => s.hydrate);

  // Hydrate dashboard data on mount
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Live mode — the dashboard drives itself: metrics advance and activity
  // streams in on a timer, no interaction (or refresh) required.
  const live = useDashboard((s) => s.live);
  const status = useDashboard((s) => s.status);
  const tick = useDashboard((s) => s.tick);
  useEffect(() => {
    if (!live || status !== "ready") return;
    const id = setInterval(tick, 2500);
    return () => clearInterval(id);
  }, [live, status, tick]);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!useUi.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);

  return (
    <div className="bg-background text-foreground flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="scroll-smooth flex-1 overflow-y-auto p-4">
          {page === "overview" && <OverviewPage />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "customers" && <CustomersPage />}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Global overlays — conditionally mounted so each open is a fresh instance */}
      {commandOpen && <CommandPalette />}
      {addCustomerOpen && <AddCustomerModal />}
    </div>
  );
}
