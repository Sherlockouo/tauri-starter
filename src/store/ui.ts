/** Global UI state — active page, sidebar, overlays. */
import { create } from "zustand";

export type PageKey = "overview" | "analytics" | "customers" | "settings";

interface UiState {
  page: PageKey;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  addCustomerOpen: boolean;
  setPage: (page: PageKey) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setAddCustomerOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  page: "overview",
  sidebarCollapsed: false,
  commandOpen: false,
  addCustomerOpen: false,
  setPage: (page) => set({ page, commandOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setAddCustomerOpen: (addCustomerOpen) => set({ addCustomerOpen }),
}));
