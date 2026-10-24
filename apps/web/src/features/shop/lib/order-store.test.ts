import { beforeEach, describe, expect, it, vi } from "vitest";

type StoreModule = typeof import("./order-store");

async function loadStore(): Promise<StoreModule> {
  return import("./order-store");
}

describe("order store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("always exposes an empty server snapshot", async () => {
    const store = await loadStore();
    expect(store.getOrderServerSnapshot()).toEqual({ orders: [] });
  });

  it("seeds and persists orders when storage is empty", async () => {
    const store = await loadStore();
    const snapshot = store.getOrderSnapshot();
    expect(snapshot.orders).toHaveLength(16);
    expect(localStorage.getItem("delysa:orders:v1")).not.toBeNull();
  });

  it("upserts orders by normalized code", async () => {
    const store = await loadStore();
    const original = store.getOrderSnapshot().orders[0];
    const replacement = {
      ...original,
      code: `  ${original.code.toLowerCase()}  `,
      recipientName: "Nama Baru",
    };

    store.saveOrder(replacement);
    const orders = store.getOrderSnapshot().orders;
    expect(orders.filter((order) => order.code === original.code)).toHaveLength(
      1,
    );
    expect(orders[0].recipientName).toBe("Nama Baru");

    const fresh = { ...original, code: "dlf-test-9999", id: 9999 };
    store.saveOrder(fresh);
    expect(store.getOrderSnapshot().orders[0].code).toBe("DLF-TEST-9999");
  });

  it("updates status with timeline and delivery timestamp", async () => {
    const store = await loadStore();
    const order = store
      .getOrderSnapshot()
      .orders.find((item) => item.status === "processing");
    expect(order).toBeDefined();
    if (!order) return;

    const at = "2026-10-24T12:00:00.000Z";
    const updated = store.updateOrderStatus(order.code, "delivered", {
      note: "Diterima",
      at,
    });

    expect(updated?.status).toBe("delivered");
    expect(updated?.deliveredAt).toBe(at);
    expect(updated?.updatedAt).toBe(at);
    expect(updated?.timeline.at(-1)).toMatchObject({
      status: "delivered",
      note: "Diterima",
    });
  });

  it("does not duplicate the same status", async () => {
    const store = await loadStore();
    const order = store.getOrderSnapshot().orders[0];
    const before = order.timeline.length;
    const updated = store.updateOrderStatus(order.code, order.status);
    expect(updated?.timeline).toHaveLength(before);
  });

  it("returns null for unknown codes", async () => {
    const store = await loadStore();
    expect(store.updateOrderStatus("DLF-UNKNOWN-0000", "paid")).toBeNull();
  });

  it("normalizes and finds codes", async () => {
    const store = await loadStore();
    expect(store.normalizeOrderCode("  dlf-20261024-8842 ")).toBe(
      "DLF-20261024-8842",
    );
    const order = store.getOrderSnapshot().orders[0];
    expect(
      store.findOrderByCode(
        store.getOrderSnapshot().orders,
        ` ${order.code.toLowerCase()} `,
      ),
    ).toEqual(order);
  });
});
