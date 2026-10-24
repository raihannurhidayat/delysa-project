import type { OrderRecord } from "~/features/shop/types";
import { isOrderStatus } from "~/features/shop/lib/order-status";

export const ORDER_STORAGE_KEY = "delysa:orders:v1";

export type OrderState = { orders: OrderRecord[] };

export function isOrderRecord(value: unknown): value is OrderRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.code === "string" &&
    isOrderStatus(record.status) &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.paymentDeadline === "string" &&
    Array.isArray(record.items) &&
    !!record.totals &&
    typeof record.totals === "object" &&
    !!record.payment &&
    typeof record.payment === "object" &&
    Array.isArray(record.timeline)
  );
}

export function loadOrderState(): OrderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const orders = (parsed as { orders?: unknown }).orders;
    if (!Array.isArray(orders)) return null;
    return { orders: orders.filter(isOrderRecord) };
  } catch {
    return null;
  }
}

export function saveOrderState(state: OrderState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota
  }
}
