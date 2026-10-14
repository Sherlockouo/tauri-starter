import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Code splitting — Vite chunks, CommandPalette lazy-loads its own chunk
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prevent vite from obscuring rust error messages
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // Tauri uses Chromium on Windows/Linux, WebKit on macOS
    target: "esnext",
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) requires the function form
        manualChunks: (id) => {
          if (/node_modules\/react(-dom)?\//.test(id)) return "vendor-react";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
