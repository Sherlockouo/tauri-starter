/** App sidebar — brand, primary navigation, footer card. Collapsible. */
import { BarChart3, ChevronsLeft, LayoutDashboard, LifeBuoy, Plus, Settings, Users, Zap } from "lucide-react";
import { Button, Separator, Tooltip } from "@heroui/react";
import { cn } from "../../lib/cn";
import { useUi, type PageKey } from "../../store/ui";
import { toast } from "@heroui/react";

const NAV: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "customers", label: "Customers", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { page, setPage, sidebarCollapsed, toggleSidebar } = useUi();

  return (
    <aside
      className={cn(
        "bg-surface flex h-full flex-col gap-1 border-r border-separator p-3 transition-[width] duration-200",
        sidebarCollapsed ? "w-[72px] items-center" : "w-60",
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-11 items-center gap-2.5", sidebarCollapsed && "justify-center")}>
        <div className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Zap className="size-4" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-foreground text-sm font-semibold">Acme Inc</span>
            <span className="text-muted text-xs">Workspace console</span>
          </div>
        )}
      </div>

      <Separator className="my-2" />

      {/* Primary actions */}
      <div className={cn("flex w-full flex-col gap-1", sidebarCollapsed && "items-center")}>
        {sidebarCollapsed ? (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              aria-label="New report"
              size="sm"
              variant="primary"
              onPress={() => toast.success("Report generation queued")}
            >
              <Plus className="size-4" />
            </Button>
            <Tooltip.Content>New report</Tooltip.Content>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            className="w-full justify-start"
            onPress={() => toast.success("Report generation queued")}
          >
            <Plus className="size-4" />
            New report
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-3 flex w-full flex-col gap-1" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          const button = (
            <Button
              aria-current={active ? "page" : undefined}
              className={cn(
                "w-full justify-start gap-2.5",
                sidebarCollapsed && "justify-center px-0",
                active
                  ? "bg-accent-soft text-accent-soft-foreground"
                  : "text-muted hover:text-foreground",
              )}
              variant="ghost"
              onPress={() => setPage(item.key)}
            >
              <Icon className="size-4 shrink-0" />
              {!sidebarCollapsed && item.label}
            </Button>
          );
          return sidebarCollapsed ? (
            <Tooltip key={item.key} delay={0}>
              {button}
              <Tooltip.Content>{item.label}</Tooltip.Content>
            </Tooltip>
          ) : (
            <div key={item.key}>{button}</div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Support entry */}
      {sidebarCollapsed ? (
        <Tooltip delay={0}>
          <Button isIconOnly aria-label="Support" variant="ghost" className="text-muted" onPress={() => toast.info("Support inbox opened")}>
            <LifeBuoy className="size-4" />
          </Button>
          <Tooltip.Content>Support</Tooltip.Content>
        </Tooltip>
      ) : (
        <div className="bg-accent-soft text-accent-soft-foreground rounded-xl p-3">
          <p className="text-sm font-medium">Need help getting started?</p>
          <p className="mt-1 text-xs opacity-80">Browse the docs or ping support anytime.</p>
          <Button
            className="mt-2.5 w-full"
            size="sm"
            variant="secondary"
            onPress={() => toast.info("Support inbox opened")}
          >
            <LifeBuoy className="size-3.5" />
            Contact support
          </Button>
        </div>
      )}

      <Separator className="my-2" />

      <Tooltip delay={0}>
        <Button
          isIconOnly
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          variant="ghost"
          className={cn("text-muted", !sidebarCollapsed && "self-end")}
          onPress={toggleSidebar}
        >
          <ChevronsLeft className={cn("size-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
        <Tooltip.Content>Collapse sidebar</Tooltip.Content>
      </Tooltip>
    </aside>
  );
}
