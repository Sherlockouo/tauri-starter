/** Renderer entry — mount the app plus the global toast region. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toast } from "@heroui/react";
import App from "./App";
import "./styles/tailwind.css";

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("Root element #app not found");

createRoot(rootEl).render(
  <StrictMode>
    <Toast.Provider placement="bottom" />
    <App />
  </StrictMode>,
);
