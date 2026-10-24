import type { OrderStatus } from "@delysa/shared";
import type { OrderRecord } from "~/features/shop/types";
import { createDemoOrders } from "~/features/shop/data/orders";
import {
  loadOrderState,
  saveOrderState,
  type OrderState,
} from "~/features/shop/lib/order-storage";

let storeState: OrderState | null = null;
let initialized = false;
const listeners = new Set<() => void>();

export const EMPTY_ORDER_STATE: OrderState = { orders: [] };

function notify() {
  listeners.forEach((listener) => listener());
}

function hydrate() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  const stored = loadOrderState();
  storeState = stored ?? { orders: createDemoOrders() };
  if (!stored) saveOrderState(storeState);
}

function persist(state: OrderState) {
  if (typeof window === "undefined") return;
  saveOrderState(state);
}

export function normalizeOrderCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findOrderByCode(
  orders: OrderRecord[],
  code: string,
): OrderRecord | undefined {
  const normalized = normalizeOrderCode(code);
  return orders.find((order) => normalizeOrderCode(order.code) === normalized);
}

export function getOrderServerSnapshot(): OrderState {
  return EMPTY_ORDER_STATE;
}

export function getOrderSnapshot(): OrderState {
  if (!initialized && typeof window !== "undefined") hydrate();
  return storeState ?? EMPTY_ORDER_STATE;
}

export function subscribeOrders(listener: () => void): () => void {
  if (typeof window !== "undefined") hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveOrder(order: OrderRecord): void {
  if (!initialized && typeof window !== "undefined") hydrate();
  const current = storeState ?? EMPTY_ORDER_STATE;
  const normalized = { ...order, code: normalizeOrderCode(order.code) };
  const existingIndex = current.orders.findIndex(
    (item) => normalizeOrderCode(item.code) === normalized.code,
  );
  const orders =
    existingIndex === -1
      ? [normalized, ...current.orders]
      : current.orders.map((item, index) =>
          index === existingIndex ? normalized : item,
        );
  storeState = { orders };
  persist(storeState);
  notify();
}

export function updateOrderStatus(
  code: string,
  status: OrderStatus,
  event?: { note?: string; at?: string },
): OrderRecord | null {
  if (!initialized && typeof window !== "undefined") hydrate();
  const current = storeState ?? EMPTY_ORDER_STATE;
  const normalized = normalizeOrderCode(code);
  const index = current.orders.findIndex(
    (order) => normalizeOrderCode(order.code) === normalized,
  );
  if (index === -1) return null;

  const order = current.orders[index];
  if (order.status === status) return order;

  const at = event?.at ?? new Date().toISOString();
  const updated: OrderRecord = {
    ...order,
    status,
    updatedAt: at,
    timeline: [
      ...order.timeline,
      { status, at, ...(event?.note ? { note: event.note } : {}) },
    ],
    ...(status === "delivered" ? { deliveredAt: at } : {}),
  };
  const orders = [...current.orders];
  orders[index] = updated;
  storeState = { orders };
  persist(storeState);
  notify();
  return updated;
}
