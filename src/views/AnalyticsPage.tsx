/** Analytics — deeper chart views: users, orders, conversion and channel table. */
import { Card, CardHeader, CardTitle, Chip, ProgressBar, Table, Tabs } from "@heroui/react";
import { useMemo, useState } from "react";
import { useDashboard } from "../store/dashboard";
import { AreaChart } from "../charts/AreaChart";
import { formatNumber, formatPercent } from "../lib/format";
import { Skeleton } from "@heroui/react";

type Metric = "users" | "orders";
type Range = "30d" | "90d";

const RANGE_DAYS: Record<Range, number> = { "30d": 30, "90d": 90 };

export function AnalyticsPage() {
  const snapshot = useDashboard((s) => s.snapshot);
  const status = useDashboard((s) => s.status);
  const [metric, setMetric] = useState<Metric>("users");
  const [range, setRange] = useState<Range>("90d");

  const series = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.metrics.slice(-RANGE_DAYS[range]).map((p) => ({
      label: p.date,
      value: p[metric],
    }));
  }, [snapshot, metric, range]);

  if (status !== "ready" || !snapshot) {
    return (
      <Card className="p-5">
        <Skeleton className="h-80 w-full rounded-lg" />
      </Card>
    );
  }

  const totalSessions = snapshot.channels.reduce((acc, c) => acc + c.sessions, 0);
  const bestChannel = [...snapshot.channels].sort((a, b) => b.sessions - a.sessions)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Card className="gap-0 p-0">
          <CardHeader className="flex-row items-center justify-between px-5 pt-4 pb-0">
            <div>
              <CardTitle className="text-sm capitalize">{metric} over time</CardTitle>
              <p className="text-muted text-xs">Daily totals for the selected period</p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs
                aria-label="Metric"
                selectedKey={metric}
                onSelectionChange={(key) => setMetric(key as Metric)}
              >
                <Tabs.ListContainer>
                  <Tabs.List>
                    <Tabs.Tab id="users">
                      Users
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="orders">
                      Orders
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
              <Tabs
                aria-label="Date range"
                selectedKey={range}
                onSelectionChange={(key) => setRange(key as Range)}
              >
                <Tabs.ListContainer>
                  <Tabs.List>
                    <Tabs.Tab id="30d">
                      30d
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="90d">
                      90d
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            </div>
          </CardHeader>
          <div className="px-3 pb-2">
            <AreaChart
              data={series}
              formatValue={(v) => formatNumber(v, true)}
              height={300}
              ariaLabel={`${metric} over the last ${RANGE_DAYS[range]} days`}
            />
          </div>
        </Card>
      </div>

      <Card className="gap-0 p-0">
        <CardHeader className="px-5 pt-4 pb-2">
          <div>
            <CardTitle className="text-sm">Channel performance</CardTitle>
            <p className="text-muted text-xs">
              {formatNumber(totalSessions, true)} total sessions · best performer:{" "}
              <span className="text-foreground font-medium">{bestChannel?.name}</span>
            </p>
          </div>
        </CardHeader>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Channel performance" className="min-w-[560px]">
              <Table.Header>
                <Table.Column isRowHeader>Channel</Table.Column>
                <Table.Column>Sessions</Table.Column>
                <Table.Column>Share</Table.Column>
                <Table.Column>Change</Table.Column>
              </Table.Header>
              <Table.Body items={snapshot.channels}>
                {(channel) => (
                  <Table.Row id={channel.name}>
                    <Table.Cell>
                      <span className="font-medium">{channel.name}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="tabular-nums">{formatNumber(channel.sessions)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex min-w-40 items-center gap-2">
                        <ProgressBar
                          aria-label={`${channel.name} share`}
                          value={(channel.sessions / totalSessions) * 100}
                          className="w-32"
                        >
                          <ProgressBar.Track>
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                        <span className="text-muted text-xs tabular-nums">
                          {formatPercent(channel.sessions / totalSessions, 0)}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip
                        color={channel.change >= 0 ? "success" : "danger"}
                        size="sm"
                        variant="soft"
                      >
                        {channel.change >= 0 ? "+" : ""}
                        {(channel.change * 100).toFixed(1)}%
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card>
    </div>
  );
}
