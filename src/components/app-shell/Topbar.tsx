/** Topbar — page title/breadcrumbs, global search trigger, quick actions. */
import { Breadcrumbs, Button, Kbd, Separator } from "@heroui/react";
import { Download, Search } from "lucide-react";
import { useUi } from "../../store/ui";
import { ThemeMenu } from "./ThemeMenu";
import { NotificationsPopover } from "./NotificationsPopover";
import { UserMenu } from "./UserMenu";
import { toast } from "@heroui/react";

const TITLES: Record<string, { section: string; page: string }> = {
  overview: { section: "Workspace", page: "Overview" },
  analytics: { section: "Workspace", page: "Analytics" },
  customers: { section: "Workspace", page: "Customers" },
  settings: { section: "Workspace", page: "Settings" },
};

export function Topbar() {
  const page = useUi((s) => s.page);
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const info = TITLES[page] ?? TITLES.overview;

  return (
    <header className="drag-region flex h-14 shrink-0 items-center gap-3 border-b border-separator px-4">
      <Breadcrumbs className="no-drag-region">
        <Breadcrumbs.Item>{info.section}</Breadcrumbs.Item>
        <Breadcrumbs.Item>{info.page}</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="flex-1" />

      {/* Global search trigger */}
      <Button
        variant="secondary"
        className="no-drag-region text-muted h-9 w-56 justify-between font-normal"
        onPress={() => setCommandOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5" />
          Search…
        </span>
        <Kbd>
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      </Button>

      <Button
        isIconOnly
        aria-label="Export data"
        variant="ghost"
        className="no-drag-region text-muted"
        onPress={() => toast.success("Export started — we'll notify you when it's ready")}
      >
        <Download className="size-4" />
      </Button>

      <div className="no-drag-region flex items-center gap-1.5">
        <ThemeMenu />
        <NotificationsPopover />
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="no-drag-region">
        <UserMenu />
      </div>
    </header>
  );
}
