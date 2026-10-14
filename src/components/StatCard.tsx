/** KPI stat card — value, period-over-period delta chip and a sparkline. */
import { Card } from "@heroui/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "../charts/Sparkline";
import { cn } from "../lib/cn";
import type { Kpi } from "../data/types";

interface StatCardProps {
  kpi: Kpi;
  format: (v: number) => string;
}

export function StatCard({ kpi, format }: StatCardProps) {
  const positive = kpi.delta >= 0;

  return (
    <Card className="gap-1 p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted text-sm">{kpi.label}</span>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            positive
              ? "bg-success-soft text-success-soft-foreground"
              : "bg-danger-soft text-danger-soft-foreground",
          )}
        >
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {(kpi.delta * 100).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-foreground text-2xl font-semibold tracking-tight tabular-nums">
          {format(kpi.value)}
        </span>
        <Sparkline data={kpi.series} positive={positive} />
      </div>
      <span className="text-muted text-xs">vs. previous 30 days</span>
    </Card>
  );
}
