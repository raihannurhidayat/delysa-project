import { ORDER_STATUSES } from "@delysa/shared";
import type { OrderRecord, OrderSort, OrderTab } from "~/features/shop/types";
import type { OrderHistorySearch } from "~/features/shop/schemas/order-history-search-schema";

export const ORDER_HISTORY_PAGE_SIZE = 4;

export const ORDER_TABS = [
  { value: "all", label: "Semua", statuses: ORDER_STATUSES },
  {
    value: "pending_payment",
    label: "Belum Bayar",
    statuses: ["pending_payment"],
  },
  {
    value: "pending_verification",
    label: "Verifikasi",
    statuses: ["pending_verification"],
  },
  { value: "paid", label: "Dibayar", statuses: ["paid"] },
  { value: "processing", label: "Diproses", statuses: ["processing"] },
  { value: "shipped", label: "Dikirim", statuses: ["shipped"] },
  { value: "delivered", label: "Selesai", statuses: ["delivered"] },
  {
    value: "closed",
    label: "Dibatalkan",
    statuses: ["cancelled", "rejected"],
  },
] as const;

const PERIOD_DAYS: Record<
  Exclude<OrderHistorySearch["period"], "all">,
  number
> = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function matchesQuery(order: OrderRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    order.code.toLowerCase().includes(needle) ||
    order.recipientName.toLowerCase().includes(needle) ||
    order.items.some((item) => item.name.toLowerCase().includes(needle))
  );
}

function matchesPeriod(
  order: OrderRecord,
  period: OrderHistorySearch["period"],
  now: Date,
): boolean {
  if (period === "all") return true;
  const cutoff = now.getTime() - PERIOD_DAYS[period] * 86_400_000;
  return Date.parse(order.createdAt) >= cutoff;
}

function matchesStatus(
  order: OrderRecord,
  status: OrderHistorySearch["status"],
): boolean {
  if (status === "all") return true;
  if (status === "closed") {
    return order.status === "cancelled" || order.status === "rejected";
  }
  return order.status === status;
}

export function filterOrders(
  orders: OrderRecord[],
  query: Pick<OrderHistorySearch, "q" | "period" | "status">,
  now = new Date(),
): OrderRecord[] {
  return orders.filter(
    (order) =>
      matchesQuery(order, query.q ?? "") &&
      matchesPeriod(order, query.period, now) &&
      matchesStatus(order, query.status),
  );
}

export function countOrdersByTab(
  orders: OrderRecord[],
  query: Pick<OrderHistorySearch, "q" | "period">,
  now = new Date(),
): Record<OrderTab, number> {
  const basis = filterOrders(
    orders,
    { q: query.q, period: query.period, status: "all" },
    now,
  );
  return ORDER_TABS.reduce(
    (counts, tab) => {
      counts[tab.value] = basis.filter((order) =>
        matchesStatus(order, tab.value),
      ).length;
      return counts;
    },
    {} as Record<OrderTab, number>,
  );
}

export function sortOrders(
  orders: OrderRecord[],
  sort: OrderSort,
): OrderRecord[] {
  const sorted = [...orders];
  if (sort === "oldest") {
    return sorted.sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
  }
  if (sort === "total_desc") {
    return sorted.sort(
      (a, b) =>
        b.totals.grandTotal - a.totals.grandTotal ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }
  return sorted.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function paginateOrders(
  orders: OrderRecord[],
  page: number,
  pageSize = ORDER_HISTORY_PAGE_SIZE,
): { items: OrderRecord[]; page: number; pageCount: number; total: number } {
  const total = orders.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: orders.slice(start, start + pageSize),
    page: safePage,
    pageCount,
    total,
  };
}
