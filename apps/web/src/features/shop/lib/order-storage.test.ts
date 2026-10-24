import { beforeEach, describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@delysa/shared";
import { createDemoOrders } from "~/features/shop/data/orders";
import { computeCartTotals } from "~/features/shop/lib/cart-totals";
import {
  isOrderRecord,
  loadOrderState,
  ORDER_STORAGE_KEY,
  saveOrderState,
} from "./order-storage";

const NOW = new Date("2026-10-24T12:00:00.000Z");

describe("order storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates 16 demo orders with 14 recent orders", () => {
    const orders = createDemoOrders(NOW);
    expect(orders).toHaveLength(16);
    const cutoff = NOW.getTime() - 30 * 86_400_000;
    expect(
      orders.filter((order) => Date.parse(order.createdAt) >= cutoff),
    ).toHaveLength(14);
  });

  it("covers all statuses with unique codes and consistent timelines", () => {
    const orders = createDemoOrders(NOW);
    expect(new Set(orders.map((order) => order.status))).toEqual(
      new Set(ORDER_STATUSES),
    );
    expect(new Set(orders.map((order) => order.code)).size).toBe(16);

    for (const order of orders) {
      expect(order.code).toMatch(/^DLF-\d{8}-[A-Z0-9]{4}$/);
      expect(order.timeline.length).toBeGreaterThan(0);
      expect(order.timeline.at(-1)?.status).toBe(order.status);
    }
  });

  it("sets payment deadlines and delivery fields", () => {
    const orders = createDemoOrders(NOW);
    for (const order of orders) {
      expect(
        Date.parse(order.paymentDeadline) - Date.parse(order.createdAt),
      ).toBe(86_400_000);
    }

    for (const order of orders) {
      if (order.status === "delivered") {
        expect(order.deliveredAt).toBeTruthy();
      }
      if (order.status === "shipped" || order.status === "delivered") {
        expect(order.courier).toBe("JNE");
        expect(order.trackingNumber).toContain("JNE-");
      }
    }
  });

  it("computes totals from items and coupon", () => {
    for (const order of createDemoOrders(NOW)) {
      const coupon = order.code.endsWith("-3308")
        ? { code: "DELYSAWISUDA", label: "Diskon Wisuda", amount: 20000 }
        : null;
      expect(order.totals).toEqual(computeCartTotals(order.items, coupon));
    }
  });

  it("loads, saves, and filters order state", () => {
    expect(loadOrderState()).toBeNull();

    const orders = createDemoOrders(NOW);
    saveOrderState({ orders });
    expect(loadOrderState()).toEqual({ orders });

    localStorage.setItem(ORDER_STORAGE_KEY, "{not json");
    expect(loadOrderState()).toBeNull();

    localStorage.setItem(
      ORDER_STORAGE_KEY,
      JSON.stringify({ orders: [orders[0], { code: "broken" }] }),
    );
    expect(loadOrderState()?.orders).toEqual([orders[0]]);
  });

  it("rejects malformed order records", () => {
    const order = createDemoOrders(NOW)[0];
    expect(isOrderRecord(order)).toBe(true);
    expect(isOrderRecord({ ...order, code: undefined })).toBe(false);
    expect(isOrderRecord({ ...order, status: "unknown" })).toBe(false);
    expect(isOrderRecord({ ...order, items: {} })).toBe(false);
  });
});
