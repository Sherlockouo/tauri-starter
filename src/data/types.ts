/** Shared dashboard data model — used by mock data and the platform bridge. */

export interface MetricPoint {
  date: string;
  revenue: number;
  users: number;
  orders: number;
}

export type KpiFormat = "currency" | "number" | "percent";

export interface Kpi {
  key: string;
  label: string;
  value: number;
  format: KpiFormat;
  /** Period-over-period change, e.g. 0.124 → +12.4% */
  delta: number;
  series: number[];
}

export interface Channel {
  name: string;
  sessions: number;
  change: number;
}

export interface TrafficSource {
  name: string;
  value: number;
  color: string;
}

export type OrderStatus = "paid" | "pending" | "shipped" | "refunded" | "cancelled";

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

export type CustomerPlan = "starter" | "pro" | "enterprise";
export type CustomerStatus = "active" | "trial" | "churned";

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: CustomerPlan;
  status: CustomerStatus;
  mrr: number;
  joined: string;
  lastSeen: string;
}

export interface Product {
  name: string;
  category: string;
  sold: number;
  revenue: number;
  stock: number;
}

export type ActivityType = "sale" | "user" | "system" | "refund";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: string;
  action: string;
  target: string;
  minutesAgo: number;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  minutesAgo: number;
  read: boolean;
  variant: "default" | "accent" | "success" | "warning" | "danger";
}

/** Full payload the dashboard hydrates from (DB-backed or mocked). */
export interface DashboardSnapshot {
  metrics: MetricPoint[];
  kpis: Kpi[];
  channels: Channel[];
  traffic: TrafficSource[];
  orders: Order[];
  customers: Customer[];
  products: Product[];
  activity: ActivityItem[];
  notifications: AppNotification[];
}
