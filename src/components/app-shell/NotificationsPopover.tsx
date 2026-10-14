/** Bell trigger + notifications popover, backed by the dashboard store. */
import { Button, Popover, Separator } from "@heroui/react";
import { Bell, CircleAlert, CircleCheck, CircleDollarSign, Info, TriangleAlert } from "lucide-react";
import { Badge } from "@heroui/react";
import { ScrollShadow } from "@heroui/react";
import { useDashboard } from "../../store/dashboard";
import { formatMinutesAgo } from "../../lib/format";
import { toast } from "@heroui/react";
import type { AppNotification } from "../../data/types";

const INDICATORS: Record<AppNotification["variant"], typeof Info> = {
  default: Info,
  accent: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export function NotificationsPopover() {
  const snapshot = useDashboard((s) => s.snapshot);
  const readIds = useDashboard((s) => s.readNotificationIds);
  const markRead = useDashboard((s) => s.markNotificationsRead);
  const notifications = snapshot?.notifications ?? [];
  const unread = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <Popover>
      <Badge.Anchor>
        {unread > 0 && (
          <Badge color="danger" size="sm">
            {unread}
          </Badge>
        )}
        <Button isIconOnly aria-label={`Notifications (${unread} unread)`} variant="ghost" className="text-muted">
          <Bell className="size-4" />
        </Button>
      </Badge.Anchor>
      <Popover.Content className="w-90">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <p className="text-foreground text-sm font-semibold">Notifications</p>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onPress={() => {
              markRead();
              toast.success("All notifications marked as read");
            }}
          >
            Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollShadow className="max-h-90">
          <ul className="divide-y divide-separator">
            {notifications.map((n) => {
              const Icon = INDICATORS[n.variant];
              return (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${
                      n.variant === "success"
                        ? "text-success"
                        : n.variant === "warning"
                          ? "text-warning"
                          : n.variant === "danger"
                            ? "text-danger"
                            : "text-accent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground truncate text-sm font-medium">{n.title}</p>
                      {!readIds.includes(n.id) && <span className="bg-accent size-1.5 shrink-0 rounded-full" />}
                    </div>
                    <p className="text-muted truncate text-xs">{n.description}</p>
                    <p className="text-muted mt-0.5 text-[11px]">{formatMinutesAgo(n.minutesAgo)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollShadow>
        <Separator />
        <div className="text-muted px-4 py-2 text-center text-xs">
          <CircleDollarSign className="mr-1 inline size-3" />
          Billing alerts are configured in Settings
        </div>
      </Popover.Content>
    </Popover>
  );
}
