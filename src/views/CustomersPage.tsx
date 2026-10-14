/** Customers — full data-table demo: search, plan filter, sorting, row drawer. */
import { useMemo, useState } from "react";
import type { SortDescriptor } from "@heroui/react";
import {
  Button,
  Card,
  SearchField,
  Select,
  ListBox,
  Table,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { useDashboard } from "../store/dashboard";
import { useUi } from "../store/ui";
import { StatusChip } from "../components/StatusChip";
import { CustomerDetailDrawer } from "../components/CustomerDetailDrawer";
import { SortableHeader } from "../components/SortableHeader";
import { formatCurrency, formatDate } from "../lib/format";
import { Skeleton } from "@heroui/react";
import type { Customer } from "../data/types";

export function CustomersPage() {
  const snapshot = useDashboard((s) => s.snapshot);
  const status = useDashboard((s) => s.status);
  const setAddCustomerOpen = useUi((s) => s.setAddCustomerOpen);

  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<"all" | Customer["plan"]>("all");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "mrr",
    direction: "descending",
  });
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    return snapshot.customers.filter((c) => {
      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchesPlan = plan === "all" || c.plan === plan;
      return matchesQuery && matchesPlan;
    });
  }, [snapshot, query, plan]);

  const sorted = useMemo(() => {
    const col = sortDescriptor.column as keyof Customer;
    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (typeof a[col] === "number" && typeof b[col] === "number") {
        cmp = (a[col] as number) - (b[col] as number);
      } else {
        cmp = String(a[col]).localeCompare(String(b[col]));
      }
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filtered, sortDescriptor]);

  if (status !== "ready" || !snapshot) {
    return (
      <Card className="p-5">
        <Skeleton className="h-80 w-full rounded-lg" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-foreground text-sm font-semibold">Customers</h2>
            <p className="text-muted text-xs">{sorted.length} customers shown</p>
          </div>
          <div className="flex items-center gap-2">
            <SearchField
              aria-label="Search customers"
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
              onSubmit={() => undefined}
            >
              <SearchField.Group className="h-8 w-60">
                <SearchField.SearchIcon className="size-3.5" />
                <SearchField.Input placeholder="Search customers…" className="text-xs" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <Select
              aria-label="Filter by plan"
              className="w-36"
              placeholder="All plans"
              selectedKey={plan === "all" ? null : plan}
              onSelectionChange={(key) => setPlan((key as Customer["plan"] | null) ?? "all")}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="starter" textValue="Starter">
                    Starter
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="pro" textValue="Pro">
                    Pro
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="enterprise" textValue="Enterprise">
                    Enterprise
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <Button variant="primary" size="sm" className="h-8" onPress={() => setAddCustomerOpen(true)}>
              <Plus className="size-3.5" />
              Add customer
            </Button>
          </div>
        </div>

        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Customers"
              className="min-w-[720px]"
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
            >
              <Table.Header>
                <Table.Column allowsSorting isRowHeader id="name">
                  {({ sortDirection }) => (
                    <SortableHeader label="Name" sortDirection={sortDirection} />
                  )}
                </Table.Column>
                <Table.Column allowsSorting id="plan">
                  {({ sortDirection }) => (
                    <SortableHeader label="Plan" sortDirection={sortDirection} />
                  )}
                </Table.Column>
                <Table.Column id="status">Status</Table.Column>
                <Table.Column allowsSorting id="mrr">
                  {({ sortDirection }) => (
                    <SortableHeader label="MRR" sortDirection={sortDirection} />
                  )}
                </Table.Column>
                <Table.Column allowsSorting id="joined">
                  {({ sortDirection }) => (
                    <SortableHeader label="Joined" sortDirection={sortDirection} />
                  )}
                </Table.Column>
                <Table.Column allowsSorting id="lastSeen">
                  {({ sortDirection }) => (
                    <SortableHeader label="Last seen" sortDirection={sortDirection} />
                  )}
                </Table.Column>
              </Table.Header>
              <Table.Body items={sorted}>
                {(customer) => (
                  <Table.Row
                    id={customer.id}
                    className="cursor-pointer"
                    onAction={() => setSelected(customer)}
                  >
                    <Table.Cell>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-muted text-xs">{customer.email}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="bg-default-soft text-default-soft-foreground rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
                        {customer.plan}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusChip status={customer.status} />
                    </Table.Cell>
                    <Table.Cell>
                      <span className="tabular-nums">{formatCurrency(customer.mrr)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-muted tabular-nums">{formatDate(customer.joined)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-muted tabular-nums">{formatDate(customer.lastSeen)}</span>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card>

      {selected && (
        <CustomerDetailDrawer
          customer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
