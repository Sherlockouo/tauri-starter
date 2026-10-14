/** Compact activity timeline with typed indicators. */
import { Card, CardHeader, CardTitle, ScrollShadow } from "@heroui/react";
import { CircleCheck, RotateCcw, UserPlus, Zap } from "lucide-react";
import { formatMinutesAgo } from "../lib/format";
import type { ActivityItem, ActivityType } from "../data/types";

const TYPE_META: Record<ActivityType, { icon: typeof Zap; className: string }> = {
  sale: { icon: CircleCheck, className: "bg-success-soft text-success-soft-foreground" },
  user: { icon: UserPlus, className: "bg-accent-soft text-accent-soft-foreground" },
  system: { icon: Zap, className: "bg-default-soft text-default-soft-foreground" },
  refund: { icon: RotateCcw, className: "bg-warning-soft text-warning-soft-foreground" },
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="px-5 pt-4 pb-2">
        <div>
          <CardTitle className="text-sm">Live activity</CardTitle>
          <p className="text-muted text-xs">What's happening across the workspace</p>
        </div>
      </CardHeader>
      <ScrollShadow className="max-h-[420px] px-5 pb-5">
        <ol className="relative space-y-4 border-l border-separator pl-4">
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            return (
              <li key={item.id} className="relative">
                <span
                  className={`absolute top-0.5 -left-[30px] flex size-6 items-center justify-center rounded-full ${meta.className}`}
                >
                  <Icon className="size-3" />
                </span>
                <p className="text-foreground text-sm leading-snug">
                  <span className="font-medium">{item.actor}</span>{" "}
                  <span className="text-muted">{item.action}</span>{" "}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-muted mt-0.5 text-xs">{formatMinutesAgo(item.minutesAgo)}</p>
              </li>
            );
          })}
        </ol>
      </ScrollShadow>
    </Card>
  );
}
