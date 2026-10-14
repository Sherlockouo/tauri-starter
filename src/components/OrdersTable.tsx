/** Recent orders — sortable, searchable, paginated table with row actions. */
import { useMemo, useState } from "react";
import type { SortDescriptor } from "@heroui/react";
import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Pagination,
  SearchField,
  Select,
  Separator,
  Table,
} from "@heroui/react";
import { ListBox } from "@heroui/react";
import {
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "@heroui/react";
import { formatCurrency, formatDate } from "../lib/format";
import { SortableHeader } from "./SortableHeader";
import type { Order, OrderStatus } from "../data/types";

const STATUS_COLOR: Record<OrderStatus, "success" | "warning" | "accent" | "default" | "danger"> = {
  paid: "success",
  pending: "warning",
  shipped: "accent",
  refunded: "default",
  cancelled: "danger",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  shipped: "Shipped",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const PAGE_SIZE = 8;

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "date",
    direction: "descending",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery =
        !q ||
        o.customer.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q);
      const matchesStatus = status === "all" || o.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const sorted = useMemo(() => {
    const col = sortDescriptor.column as keyof Order;
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <Card className="gap-0 p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Recent orders</h2>
          <p className="text-muted text-xs">
            {sorted.length} of {orders.length} orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchField
            aria-label="Search orders"
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            onClear={() => setQuery("")}
            onSubmit={() => undefined}
          >
            <SearchField.Group className="h-8 w-56">
              <SearchField.SearchIcon className="size-3.5" />
              <SearchField.Input placeholder="Search orders…" className="text-xs" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Select
            aria-label="Filter by status"
            className="w-36"
            placeholder="All statuses"
            selectedKey={status === "all" ? null : status}
            onSelectionChange={(key) => {
              setStatus(((key as string) ?? "all") as "all" | OrderStatus);
              setPage(1);
            }}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All statuses">
                  All statuses
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="paid" textValue="Paid">
                  Paid
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="pending" textValue="Pending">
                  Pending
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="shipped" textValue="Shipped">
                  Shipped
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="refunded" textValue="Refunded">
                  Refunded
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="cancelled" textValue="Cancelled">
                  Cancelled
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Recent orders"
            className="min-w-[640px]"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          >
            <Table.Header>
              <Table.Column allowsSorting isRowHeader id="id">
                {({ sortDirection }) => (
                <SortableHeader label="Order" sortDirection={sortDirection} />
              )}
              </Table.Column>
              <Table.Column allowsSorting id="customer">
                {({ sortDirection }) => (
                <SortableHeader label="Customer" sortDirection={sortDirection} />
              )}
              </Table.Column>
              <Table.Column allowsSorting id="product">
                {({ sortDirection }) => (
                <SortableHeader label="Product" sortDirection={sortDirection} />
              )}
              </Table.Column>
              <Table.Column id="status">Status</Table.Column>
              <Table.Column allowsSorting id="amount">
                {({ sortDirection }) => (
                <SortableHeader label="Amount" sortDirection={sortDirection} />
              )}
              </Table.Column>
              <Table.Column allowsSorting id="date">
                {({ sortDirection }) => (
                <SortableHeader label="Date" sortDirection={sortDirection} />
              )}
              </Table.Column>
              <Table.Column id="actions">
                <span className="sr-only">Actions</span>
              </Table.Column>
            </Table.Header>
            <Table.Body items={rows}>
              {(order) => (
                <Table.Row id={order.id}>
                  <Table.Cell>
                    <span className="font-medium tabular-nums">{order.id}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col leading-tight">
                      <span>{order.customer}</span>
                      <span className="text-muted text-xs">{order.email}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-muted">{order.product}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip color={STATUS_COLOR[order.status]} size="sm" variant="soft">
                      {STATUS_LABEL[order.status]}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="tabular-nums">{formatCurrency(order.amount)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-muted tabular-nums">{formatDate(order.date)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <RowActions order={order} />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Separator />
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-muted text-xs">
          Page {current} of {totalPages}
        </p>
        <Pagination className="scale-90">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={current === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link isActive={p === current} onPress={() => setPage(p)}>
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={current === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>
    </Card>
  );
}

function RowActions({ order }: { order: Order }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        isIconOnly
        aria-label={`View ${order.id}`}
        variant="ghost"
        size="sm"
        className="text-muted"
        onPress={() => toast.info(`Details for ${order.id} (template stub)`)}
      >
        <Eye className="size-3.5" />
      </Button>
      <Dropdown>
        <Button isIconOnly aria-label={`More actions for ${order.id}`} variant="ghost" size="sm" className="text-muted">
          <MoreHorizontal className="size-3.5" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "copy") {
                navigator.clipboard?.writeText(order.id).catch(() => undefined);
                toast.success(`Copied ${order.id} to clipboard`);
              } else if (key === "refund") {
                toast.warning(`Refund flow for ${order.id} is a template stub`);
              } else if (key === "invoice") {
                toast.info(`Invoice for ${order.id} sent to printer queue`);
              } else if (key === "delete") {
                toast.danger(`Delete flow for ${order.id} is a template stub`);
              }
            }}
          >
            <Dropdown.Item id="copy" textValue="Copy order id">
              <Printer className="size-4" />
              <Label>Copy order id</Label>
            </Dropdown.Item>
            <Dropdown.Item id="invoice" textValue="Send invoice">
              <ArrowUpRight className="size-4" />
              <Label>Send invoice</Label>
            </Dropdown.Item>
            <Dropdown.Item id="refund" textValue="Refund">
              <RotateCcw className="size-4" />
              <Label>Refund</Label>
            </Dropdown.Item>
            <Dropdown.Item id="delete" textValue="Delete" variant="danger">
              <Trash2 className="size-4" />
              <Label>Delete</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
