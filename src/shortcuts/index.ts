import { appActions } from "../store";

/**
 * §7: Keyboard-First Input — Separate input routing system
 *
 * Every primary action has a keyboard shortcut.
 * Single-key shortcuts for top actions.
 * Command palette from local index.
 */

interface ShortcutEntry {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
  /** If true, shortcut is active even when an input is focused */
  global?: boolean;
}

const shortcuts: ShortcutEntry[] = [
  {
    key: "k",
    meta: true,
    handler: () => appActions.toggleCommandPalette(),
    description: "Toggle command palette",
    global: true,
  },
  {
    key: "k",
    ctrl: true,
    handler: () => appActions.toggleCommandPalette(),
    description: "Toggle command palette (Linux/Windows)",
    global: true,
  },
  {
    key: "1",
    handler: () => appActions.setActiveTab("single"),
    description: "Switch to Single mode",
  },
  {
    key: "2",
    handler: () => appActions.setActiveTab("batch"),
    description: "Switch to Batch mode",
  },
  {
    key: "Escape",
    handler: () => {
      appActions.closeCommandPalette();
    },
    description: "Close command palette",
    global: true,
  },
];

/**
 * Register global keyboard shortcuts.
 * Called once during bootstrap Phase 5 (after render).
 */
export function registerShortcuts(): void {
  document.addEventListener("keydown", handleKeyDown);
}

function handleKeyDown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement;
  const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

  for (const shortcut of shortcuts) {
    if (isInput && !shortcut.global) continue;

    const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : !e.metaKey;
    const ctrlMatch = shortcut.ctrl ? e.ctrlKey : (!shortcut.meta && !e.ctrlKey);
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

    if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
      e.preventDefault();
      e.stopPropagation();
      shortcut.handler();
      return;
    }
  }
}

/** Export for command palette to show available shortcuts */
export function getShortcutList(): Array<{ key: string; description: string }> {
  return shortcuts.map((s) => ({
    key: [
      s.meta ? "⌘" : "",
      s.ctrl ? "Ctrl+" : "",
      s.shift ? "Shift+" : "",
      s.key.toUpperCase(),
    ]
      .filter(Boolean)
      .join(""),
    description: s.description,
  }));
}
