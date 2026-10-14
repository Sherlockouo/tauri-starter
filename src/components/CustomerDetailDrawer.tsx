/** Customer details in a slide-over drawer — demonstrates the Drawer primitive. */
import { useMemo, useState } from "react";
import { Button, Chip, Drawer, Meter, ScrollShadow, Separator, TextArea, toast } from "@heroui/react";
import { Sparkline } from "../charts/Sparkline";
import { formatCurrency, formatDate, formatNumber } from "../lib/format";
import { StatusChip } from "./StatusChip";
import { useDashboard } from "../store/dashboard";
import type { Customer } from "../data/types";

interface CustomerDetailDrawerProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailDrawer({ customer, onClose }: CustomerDetailDrawerProps) {
  const orders = useDashboard((s) => s.snapshot?.orders);
  const [note, setNote] = useState("");

  // Deterministic per-customer login series for the usage sparkline
  const usage = useMemo(() => {
    if (!customer) return [];
    const seed = customer.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 30 }, (_, i) => 30 + ((seed * (i + 7)) % 60) + (i % 5) * 2);
  }, [customer]);

  const customerOrders = (orders ?? []).filter((o) => o.customer === customer.name).slice(0, 4);

  const handleSave = () => {
    onClose();
    toast.success("Customer updated", {
      description: note.trim() ? "Note saved to the customer timeline." : "No changes to sync.",
    });
  };

  return (
    <Drawer isOpen onOpenChange={onClose}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full gap-0 p-0 sm:max-w-sm">
            <Drawer.Header className="items-start">
              <div>
                <Drawer.Heading className="text-lg">{customer.name}</Drawer.Heading>
                <p className="text-muted text-sm">{customer.email}</p>
              </div>
              <Drawer.CloseTrigger aria-label="Close details" />
            </Drawer.Header>
            <Drawer.Body className="scroll-shadow gap-5 overflow-y-auto">
              <div className="flex items-center gap-2">
                <StatusChip status={customer.status} />
                <span className="bg-default-soft text-default-soft-foreground rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                  {customer.plan} plan
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted text-xs">Monthly recurring revenue</p>
                  <p className="text-foreground text-xl font-semibold tabular-nums">
                    {formatCurrency(customer.mrr)}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs">Customer since</p>
                  <p className="text-foreground text-sm font-medium">{formatDate(customer.joined)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Last seen</p>
                  <p className="text-foreground text-sm font-medium">{formatDate(customer.lastSeen)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Account id</p>
                  <p className="text-foreground text-sm font-medium tabular-nums">{customer.id}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Meter aria-label="Account health" className="w-full" value={72}>
                  <p className="text-foreground text-sm font-medium">Account health</p>
                  <Meter.Output />
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>
                <p className="text-muted mt-1.5 text-xs">
                  {formatNumber(1284)} logins in the last 30 days · low churn risk
                </p>
              </div>

              <Separator />

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-foreground text-sm font-medium">Usage · last 30 days</p>
                  <span className="text-muted text-xs tabular-nums">sessions/day</span>
                </div>
                <Sparkline data={usage} width={280} height={48} positive />
              </div>

              <Separator />

              <div>
                <p className="text-foreground mb-2 text-sm font-medium">Recent orders</p>
                {customerOrders.length === 0 ? (
                  <p className="text-muted text-sm">No orders in the last 28 days.</p>
                ) : (
                  <ScrollShadow className="max-h-44">
                    <ul className="space-y-2 pr-1">
                      {customerOrders.map((order) => (
                        <li
                          key={order.id}
                          className="bg-default-soft flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-foreground truncate text-xs font-medium tabular-nums">
                              {order.id}
                            </p>
                            <p className="text-muted truncate text-xs">{order.product}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-foreground text-xs font-medium tabular-nums">
                              {formatCurrency(order.amount)}
                            </span>
                            <Chip
                              color={order.status === "paid" ? "success" : order.status === "refunded" || order.status === "cancelled" ? "danger" : "warning"}
                              size="sm"
                              variant="soft"
                              className="capitalize"
                            >
                              {order.status}
                            </Chip>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollShadow>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-foreground mb-2 text-sm font-medium">Recent timeline</p>
                <ol className="space-y-2.5 border-l border-separator pl-3.5">
                  {[
                    { label: "Opened weekly digest email", ago: "2h ago" },
                    { label: "Invited 2 teammates to the workspace", ago: "1d ago" },
                    { label: "Support ticket #4821 resolved", ago: "4d ago" },
                    { label: `Switched to the ${customer.plan} plan`, ago: "3w ago" },
                  ].map((entry) => (
                    <li key={entry.label} className="relative">
                      <span className="bg-accent absolute top-1.5 -left-[19px] size-1.5 rounded-full" />
                      <p className="text-foreground text-sm">{entry.label}</p>
                      <p className="text-muted text-xs">{entry.ago}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <Separator />

              <div>
                <p className="text-foreground mb-2 text-sm font-medium">Notes</p>
                <TextArea
                  aria-label="Customer notes"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note about this customer…"
                  className="min-h-20"
                />
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" onPress={onClose}>
                Close
              </Button>
              <Button onPress={handleSave}>Save changes</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
