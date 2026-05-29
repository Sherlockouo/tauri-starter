import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// §4: Code Splitting — Vite route-level chunks, each view is its own chunk
export default defineConfig({
  plugins: [solidPlugin()],
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
    // §4: Route-level code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-flexsearch": ["flexsearch"],
          "vendor-solid": ["solid-js", "solid-js/web", "solid-js/store"],
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
