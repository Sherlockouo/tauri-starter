/**
 * Deterministic mock dataset for the dashboard template.
 * Works in the plain browser (no backend required); desktop shells overlay
 * DB-backed metrics on top of it via the platform bridge.
 */
import type {
  ActivityItem,
  AppNotification,
  Channel,
  Customer,
  DashboardSnapshot,
  Kpi,
  MetricPoint,
  Order,
  OrderStatus,
  Product,
  TrafficSource,
} from "./types";

/** mulberry32 — tiny seeded PRNG so every reload shows the same data. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Ava", "Liam", "Mia", "Noah", "Zoe", "Ethan", "Isla", "Lucas", "Emma", "Owen",
  "Chloe", "Mason", "Ruby", "Leo", "Nina", "Jack", "Luna", "Henry", "Ivy", "Felix",
];
const LAST_NAMES = [
  "Chen", "Patel", "Kim", "Garcia", "Nguyen", "Rossi", "Meyer", "Okafor", "Silva", "Weber",
  "Novak", "Ivanov", "Dubois", "Tanaka", "Ali", "Brown", "Klein", "Moreau", "Sato", "Reyes",
];
const PRODUCTS: Array<[string, string]> = [
  ["Nimbus Pro License", "Software"],
  ["Atlas Data Add-on", "Software"],
  ["Vertex Analytics", "Software"],
  ["Beacon Support Plan", "Services"],
  ["Onboarding Workshop", "Services"],
  ["Scale Infrastructure", "Infrastructure"],
];
const DOMAINS = ["acme.io", "globex.com", "initech.dev", "umbrella.co", "hooli.net"];

function fullName(r: () => number): string {
  const first = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** ~DAYS days of daily metrics, deterministic random walk. */
export function generateMetrics(days = 180): MetricPoint[] {
  const r = rng(20260918);
  const points: MetricPoint[] = [];

  for (let i = days; i >= 0; i--) {
    // Gentle upward trend across the period + weekly-style waves + centered
    // noise — non-compounding, so period-over-period deltas stay realistic.
    const pos = (days - i) / days;
    const wiggle = (wavelength: number) =>
      1 + Math.sin(i / wavelength) * 0.04 + (r() - 0.5) * 0.1;
    points.push({
      date: isoDaysAgo(i),
      revenue: Math.round(36000 * (1 + 0.25 * pos) * wiggle(3.6) * 100) / 100,
      users: Math.round(10800 * (1 + 0.2 * pos) * wiggle(5.2)),
      orders: Math.round(620 * (1 + 0.3 * pos) * wiggle(4.1)),
    });
  }
  return points;
}

export function buildKpis(metrics: MetricPoint[]): Kpi[] {
  const slice = (n: number) => metrics.slice(-n);
  const sum = (xs: MetricPoint[], key: "revenue" | "users" | "orders") =>
    xs.reduce((acc, p) => acc + p[key], 0);

  const last30 = slice(30);
  const prev30 = slice(60).slice(0, 30);
  const last7 = slice(7);
  const prev7 = slice(14).slice(0, 7);

  const delta = (now: number, before: number) => (before === 0 ? 0 : (now - before) / before);

  const revenueNow = sum(last30, "revenue");
  const usersNow = sum(last30, "users") / last30.length;
  const ordersNow = sum(last30, "orders");
  const conversion = ordersNow / Math.max(1, sum(last30, "users"));

  return [
    {
      key: "revenue",
      label: "Total Revenue",
      value: revenueNow,
      format: "currency",
      delta: delta(revenueNow, sum(prev30, "revenue")),
      series: last30.map((p) => p.revenue),
    },
    {
      key: "users",
      label: "Active Users",
      value: Math.round(usersNow),
      format: "number",
      delta: delta(usersNow, sum(prev30, "users") / prev30.length),
      series: last30.map((p) => p.users),
    },
    {
      key: "orders",
      label: "Orders",
      value: ordersNow,
      format: "number",
      delta: delta(ordersNow, sum(prev30, "orders")),
      series: last7.map((p) => p.orders),
    },
    {
      key: "conversion",
      label: "Conversion Rate",
      value: conversion,
      format: "percent",
      delta: delta(conversion, sum(prev7, "orders") / Math.max(1, sum(prev7, "users"))),
      series: last7.map((p) => p.orders / Math.max(1, p.users)),
    },
  ];
}

const CHANNEL_SEED: Array<[string, number, number]> = [
  ["Organic Search", 48200, 0.124],
  ["Direct", 31450, 0.062],
  ["Referral", 18700, -0.031],
  ["Social", 14220, 0.214],
  ["Email", 9680, 0.018],
  ["Paid Ads", 7340, -0.087],
];

export function generateChannels(): Channel[] {
  return CHANNEL_SEED.map(([name, sessions, change]) => ({ name, sessions, change }));
}

export function generateTraffic(): TrafficSource[] {
  return [
    { name: "Desktop web", value: 46, color: "var(--accent)" },
    { name: "Mobile app", value: 32, color: "var(--success)" },
    { name: "Mobile web", value: 15, color: "var(--warning)" },
    { name: "API / integrations", value: 7, color: "var(--danger)" },
  ];
}

export function generateOrders(customers: Customer[], count = 42): Order[] {
  const r = rng(42);
  const statuses: OrderStatus[] = ["paid", "pending", "shipped", "refunded", "cancelled"];
  const weights = [0.42, 0.18, 0.22, 0.1, 0.08];
  const orders: Order[] = [];

  for (let i = 0; i < count; i++) {
    const pick = r();
    let acc = 0;
    let status: OrderStatus = "paid";
    for (let s = 0; s < statuses.length; s++) {
      acc += weights[s];
      if (pick <= acc) {
        status = statuses[s];
        break;
      }
    }
    const [product] = PRODUCTS[Math.floor(r() * PRODUCTS.length)];
    const customer = customers[Math.floor(r() * customers.length)];
    orders.push({
      id: `ORD-${(7240 - i * 7).toString().padStart(5, "0")}`,
      customer: customer.name,
      email: customer.email,
      product,
      amount: Math.round((30 + r() * 950) * 100) / 100,
      status,
      date: isoDaysAgo(Math.floor(r() * 28)),
    });
  }
  return orders.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateCustomers(count = 64): Customer[] {
  const r = rng(64);
  const plans: Customer["plan"][] = ["starter", "pro", "enterprise"];
  const statuses: Customer["status"][] = ["active", "active", "active", "trial", "churned"];
  const customers: Customer[] = [];

  for (let i = 0; i < count; i++) {
    const name = fullName(r);
    const plan = plans[Math.floor(r() * (r() > 0.8 ? 3 : 2))];
    const status = statuses[Math.floor(r() * statuses.length)];
    customers.push({
      id: `CUS-${1200 + i}`,
      name,
      email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1].toLowerCase()}@${
        DOMAINS[Math.floor(r() * DOMAINS.length)]
      }`,
      plan,
      status,
      mrr:
        plan === "enterprise"
          ? Math.round(900 + r() * 2400)
          : plan === "pro"
            ? Math.round(90 + r() * 240)
            : Math.round(9 + r() * 60),
      joined: isoDaysAgo(Math.floor(r() * 720)),
      lastSeen: isoDaysAgo(Math.floor(r() * 30)),
    });
  }
  return customers;
}

export function generateProducts(): Product[] {
  const r = rng(7);
  return PRODUCTS.map(([name, category]) => {
    const sold = Math.round(120 + r() * 900);
    return {
      name,
      category,
      sold,
      revenue: Math.round(sold * (25 + r() * 180)),
      stock: Math.round(r() * 480),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export function generateActivity(): ActivityItem[] {
  return [
    { id: "act-1", type: "sale", actor: "Ava Chen", action: "purchased", target: "Nimbus Pro License", minutesAgo: 4 },
    { id: "act-2", type: "user", actor: "Liam Patel", action: "upgraded to", target: "Enterprise plan", minutesAgo: 22 },
    { id: "act-3", type: "refund", actor: "Support Bot", action: "refunded", target: "ORD-07196", minutesAgo: 51 },
    { id: "act-4", type: "system", actor: "Billing", action: "recovered", target: "3 failed payments", minutesAgo: 96 },
    { id: "act-5", type: "sale", actor: "Mia Kim", action: "purchased", target: "Vertex Analytics", minutesAgo: 143 },
    { id: "act-6", type: "user", actor: "Noah Garcia", action: "invited", target: "2 teammates", minutesAgo: 210 },
    { id: "act-7", type: "system", actor: "Deploy Bot", action: "shipped", target: "v2.14.0 to production", minutesAgo: 380 },
    { id: "act-8", type: "refund", actor: "Zoe Nguyen", action: "requested refund for", target: "ORD-07099", minutesAgo: 520 },
  ];
}

export function generateNotifications(): AppNotification[] {
  return [
    {
      id: "ntf-1",
      title: "Weekly report is ready",
      description: "Revenue is up 12.4% vs. last period.",
      minutesAgo: 12,
      read: false,
      variant: "success",
    },
    {
      id: "ntf-2",
      title: "3 failed payments",
      description: "Retry scheduled for tonight at 02:00.",
      minutesAgo: 48,
      read: false,
      variant: "warning",
    },
    {
      id: "ntf-3",
      title: "New enterprise lead",
      description: "Globex requested a custom quote.",
      minutesAgo: 130,
      read: false,
      variant: "accent",
    },
    {
      id: "ntf-4",
      title: "API latency degraded",
      description: "p95 rose above 800ms for 6 minutes.",
      minutesAgo: 300,
      read: true,
      variant: "danger",
    },
    {
      id: "ntf-5",
      title: "Backup completed",
      description: "Snapshot stored in the primary region.",
      minutesAgo: 720,
      read: true,
      variant: "default",
    },
  ];
}


/**
 * Next live data point — advances the series by one day with fresh noise.
 * Values mean-revert around stable anchors so an unattended dashboard
 * oscillates realistically instead of drifting (or exploding) over time.
 */
export function nextMetricPoint(prev: MetricPoint): MetricPoint {
  const d = new Date(`${prev.date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const step = (prevValue: number, anchor: number, noisePct: number) => {
    const reversion = ((anchor - prevValue) / anchor) * 0.08;
    return Math.max(
      1,
      Math.round(prevValue * (1 + reversion) * (1 + (Math.random() - 0.5) * noisePct)),
    );
  };

  return {
    date,
    revenue: Math.round(step(prev.revenue, 45000, 0.06) * 100) / 100,
    users: step(prev.users, 13000, 0.04),
    orders: step(prev.orders, 780, 0.07),
  };
}

/** Full in-memory snapshot — the browser-mode data source. */
export function buildMockSnapshot(): DashboardSnapshot {
  const metrics = generateMetrics();
  const customers = generateCustomers();
  return {
    metrics,
    kpis: buildKpis(metrics),
    channels: generateChannels(),
    traffic: generateTraffic(),
    customers,
    orders: generateOrders(customers),
    products: generateProducts(),
    activity: generateActivity(),
    notifications: generateNotifications(),
  };
}
