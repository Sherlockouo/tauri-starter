/**
 * ⌘K command palette — fuzzy-ish filter over navigation + quick actions.
 * Rendered through the HeroUI Modal overlay primitives.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@heroui/react";
import {
  BarChart3,
  Download,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@heroui/react";
import { useUi } from "../../store/ui";
import { toast } from "@heroui/react";
import { cn } from "../../lib/cn";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  run: () => void;
}

export function CommandPalette() {
  const open = useUi((s) => s.commandOpen);
  const setOpen = useUi((s) => s.setCommandOpen);
  if (!open) return null;
  return <PaletteBody onClose={() => setOpen(false)} />;
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const setPage = useUi((s) => s.setPage);
  const setAddCustomerOpen = useUi((s) => s.setAddCustomerOpen);
      const { resolvedTheme, setTheme } = useTheme("system");

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(
    () => [
      { id: "nav-overview", label: "Go to Overview", icon: LayoutDashboard, run: () => setPage("overview") },
      { id: "nav-analytics", label: "Go to Analytics", icon: BarChart3, run: () => setPage("analytics") },
      { id: "nav-customers", label: "Go to Customers", icon: Users, run: () => setPage("customers") },
      { id: "nav-settings", label: "Go to Settings", icon: Settings, run: () => setPage("settings") },
      {
        id: "action-theme",
        label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "action-invite",
        label: "Add customer…",
        hint: "Modal demo",
        icon: Plus,
        run: () => setAddCustomerOpen(true),
      },
      {
        id: "action-export",
        label: "Export data as CSV",
        hint: "Toast demo",
        icon: Download,
        run: () => toast.success("Export started — we'll notify you when it's ready"),
      },
    ],
    [resolvedTheme, setAddCustomerOpen, setPage, setTheme],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.id.includes(q),
    );
  }, [commands, query]);

  // Fresh instance per open — reset filter + focus on mount
  useEffect(() => {
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const runCommand = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runCommand(results[active]);
    }
  };

  return (
    <Modal isOpen onOpenChange={onClose}>
      <Modal.Backdrop>
        <Modal.Container placement="top" className="mt-24">
          <Modal.Dialog className="gap-0 overflow-hidden p-0 sm:max-w-xl">
            <div className="flex items-center gap-3 border-b border-separator px-4">
              <Search className="text-muted size-4 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search…"
                aria-label="Search commands"
                className="text-foreground placeholder:text-muted h-12 flex-1 bg-transparent text-sm outline-none"
              />
              <kbd className="bg-default-soft text-default-soft-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                ESC
              </kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Commands">
              {results.length === 0 && (
                <li className="text-muted px-3 py-8 text-center text-sm">No matching commands</li>
              )}
              {results.map((command, i) => {
                const Icon = command.icon;
                return (
                  <li key={command.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                        i === active ? "bg-accent-soft text-accent-soft-foreground" : "text-foreground",
                      )}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => runCommand(command)}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{command.label}</span>
                      {command.hint && (
                        <span className="text-muted text-xs">{command.hint}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="text-muted flex items-center gap-4 border-t border-separator px-4 py-2 text-xs">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span className="ml-auto">Acme Command</span>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
