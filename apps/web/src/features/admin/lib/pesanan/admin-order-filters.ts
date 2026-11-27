import { ORDER_STATUSES, type OrderStatus } from "@delysa/shared";
import { ORDER_TABS } from "~/features/shop/lib/order-filters";
import type { OrderTab } from "~/features/shop/types";
import type {
  AdminOrderFilters,
  AdminOrderPeriod,
  AdminOrderView,
} from "./admin-order.types";

export const DEFAULT_ADMIN_ORDER_FILTERS: AdminOrderFilters = {
  search: "",
  statusTab: "all",
  period: "all",
  batch: "all",
};

/** Label tab sesuai Gambar 1; tab memakai `ORDER_TABS` dari shop (satu sumber). */
export const ADMIN_TAB_LABELS: Record<OrderTab, string> = {
  all: "Semua",
  pending_payment: "Menunggu Pembayaran",
  pending_verification: "Menunggu Verifikasi",
  paid: "Sudah Dibayar",
  processing: "Sedang Dirangkai",
  shipped: "Dalam Pengantaran",
  delivered: "Selesai Terkirim",
  closed: "Dibatalkan & Ditolak",
};

/** Tanggal (d-d d-m-yyyy) menurut zona Asia/Jakarta — dipakai untuk periode "today". */
function jakartaDateKey(timestamp: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

const PERIOD_DAYS: Record<Exclude<AdminOrderPeriod, "all">, number | null> = {
  today: null,
  "7d": 7,
};

function matchesQuery(order: AdminOrderView, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    order.code.toLowerCase().includes(needle) ||
    order.recipientName.toLowerCase().includes(needle) ||
    order.items.some((item) => item.name.toLowerCase().includes(needle))
  );
}

function matchesPeriod(
  order: AdminOrderView,
  period: AdminOrderPeriod,
  now: Date,
): boolean {
  if (period === "all") return true;
  const createdAt = Date.parse(order.createdAt);
  const days = PERIOD_DAYS[period];

  if (days === null) {
    return jakartaDateKey(now.getTime()) === jakartaDateKey(createdAt);
  }
  return createdAt >= now.getTime() - days * 86_400_000;
}

function matchesStatus(order: AdminOrderView, statusTab: OrderTab): boolean {
  const tab = ORDER_TABS.find((entry) => entry.value === statusTab);
  if (!tab) return true;
  return (tab.statuses as readonly OrderStatus[]).includes(order.status);
}

export function filterAdminOrders(
  orders: AdminOrderView[],
  filters: AdminOrderFilters,
  now: Date = new Date(),
): AdminOrderView[] {
  return orders.filter(
    (order) =>
      matchesStatus(order, filters.statusTab) &&
      matchesQuery(order, filters.search) &&
      matchesPeriod(order, filters.period, now) &&
      (filters.batch === "all" || order.batch === filters.batch),
  );
}

/** Ringkasan antrean prioritas + count per tab untuk rail status admin. */
export function summarizeAdminOrders(orders: AdminOrderView[]): {
  verification: number;
  assembly: number;
  delivery: number;
  counts: Record<OrderTab, number>;
} {
  const counts = Object.fromEntries(
    (ORDER_STATUSES as readonly string[]).map((status) => [status, 0]),
  ) as Record<string, number>;

  for (const order of orders) {
    counts[order.status] += 1;
  }

  return {
    verification: counts.pending_verification ?? 0,
    assembly: counts.processing ?? 0,
    delivery: counts.shipped ?? 0,
    counts: {
      all: orders.length,
      pending_payment: counts.pending_payment ?? 0,
      pending_verification: counts.pending_verification ?? 0,
      paid: counts.paid ?? 0,
      processing: counts.processing ?? 0,
      shipped: counts.shipped ?? 0,
      delivered: counts.delivered ?? 0,
      closed: (counts.cancelled ?? 0) + (counts.rejected ?? 0),
    },
  };
}

export { ORDER_TABS };
