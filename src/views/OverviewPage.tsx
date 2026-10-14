/** Overview — KPI cards, revenue chart, channels, traffic, orders, activity, products. */
import { Card, CardHeader, CardTitle, Tabs, Separator } from "@heroui/react";
import { useMemo, useState } from "react";
import { useDashboard } from "../store/dashboard";
import { StatCard } from "../components/StatCard";
import { OrdersTable } from "../components/OrdersTable";
import { ActivityFeed } from "../components/ActivityFeed";
import { TopProducts } from "../components/TopProducts";
import { AreaChart } from "../charts/AreaChart";
import { BarChart } from "../charts/BarChart";
import { DonutChart } from "../charts/DonutChart";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "../lib/format";
import { Skeleton } from "@heroui/react";

type Range = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function OverviewPage() {
  const snapshot = useDashboard((s) => s.snapshot);
  const status = useDashboard((s) => s.status);
  const live = useDashboard((s) => s.live);
  const [range, setRange] = useState<Range>("30d");

  const series = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.metrics.slice(-RANGE_DAYS[range]).map((p) => ({
      label: formatDate(p.date),
      value: p.revenue,
    }));
  }, [snapshot, range]);

  if (status !== "ready" || !snapshot) {
    return <OverviewSkeleton />;
  }

  const formatters = {
    currency: (v: number) => formatCurrency(v, true),
    number: (v: number) => formatNumber(v, true),
    percent: (v: number) => formatPercent(v),
  } as const;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshot.kpis.map((kpi) => (
          <StatCard key={kpi.key} kpi={kpi} format={formatters[kpi.format]} />
        ))}
      </div>

      {/* Revenue + activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="gap-0 p-0 xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between px-5 pt-4 pb-0">
            <div>
              <CardTitle className="text-sm">Revenue</CardTitle>
              <p className="text-muted text-xs">Daily revenue for the selected period</p>
            </div>
            <div className="flex items-center gap-3">
              {live && (
                <span className="bg-success-soft text-success-soft-foreground flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
                  <span className="relative flex size-1.5">
                    <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                    <span className="bg-success relative inline-flex size-1.5 rounded-full" />
                  </span>
                  Live
                </span>
              )}
              <Tabs
              aria-label="Date range"
              selectedKey={range}
              onSelectionChange={(key) => setRange(key as Range)}
            >
              <Tabs.ListContainer>
                <Tabs.List>
                  {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
                    <Tabs.Tab key={r} id={r}>
                      {r}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            </div>
          </CardHeader>
          <div className="px-3 pb-2">
            <AreaChart
              data={series}
              formatValue={(v) => formatCurrency(v, true)}
              ariaLabel={`Revenue for the last ${RANGE_DAYS[range]} days`}
            />
          </div>
        </Card>

        <ActivityFeed items={snapshot.activity} />
      </div>

      {/* Channels + traffic */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="gap-3 p-5 xl:col-span-2">
          <div>
            <h2 className="text-foreground text-sm font-semibold">Sessions by channel</h2>
            <p className="text-muted text-xs">Last 30 days vs. previous period</p>
          </div>
          <BarChart
            data={snapshot.channels.map((c) => ({ label: c.name, value: c.sessions, change: c.change }))}
            formatValue={(v) => formatNumber(v, true)}
            ariaLabel="Sessions by channel"
          />
        </Card>

        <Card className="gap-4 p-5">
          <div>
            <h2 className="text-foreground text-sm font-semibold">Traffic share</h2>
            <p className="text-muted text-xs">Where sessions come from</p>
          </div>
          <DonutChart data={snapshot.traffic} centerLabel="Sessions" ariaLabel="Traffic share by platform" />
        </Card>
      </div>

      {/* Orders + products */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OrdersTable orders={snapshot.orders} />
        </div>
        <TopProducts products={snapshot.products} />
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="gap-3 p-5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>
      </div>
      <Separator className="opacity-0" />
    </div>
  );
}
