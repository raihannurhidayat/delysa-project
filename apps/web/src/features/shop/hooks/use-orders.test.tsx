import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type OrdersHook = typeof import("./use-orders");
type Store = typeof import("~/features/shop/lib/order-store");

async function loadModules(): Promise<{ hooks: OrdersHook; store: Store }> {
  const store = await import("~/features/shop/lib/order-store");
  const hooks = await import("./use-orders");
  return { hooks, store };
}

describe("useOrders", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("loads seeded orders after mount", async () => {
    const { hooks, store } = await loadModules();
    expect(store.getOrderServerSnapshot()).toEqual({ orders: [] });

    const { result } = renderHook(() => hooks.useOrders());
    await waitFor(() => expect(result.current.orders).toHaveLength(16));
  });

  it("finds an order by normalized code", async () => {
    const { hooks, store } = await loadModules();
    const code = store.getOrderSnapshot().orders[0].code;
    const { result } = renderHook(() =>
      hooks.useOrder(`  ${code.toLowerCase()}  `),
    );
    await waitFor(() => expect(result.current?.code).toBe(code));
  });

  it("returns undefined for an unknown code", async () => {
    const { hooks } = await loadModules();
    const { result } = renderHook(() => hooks.useOrder("DLF-UNKNOWN-0000"));
    await waitFor(() => expect(result.current).toBeUndefined());
  });

  it("re-renders after saving a new order", async () => {
    const { hooks, store } = await loadModules();
    const base = store.getOrderSnapshot().orders[0];
    const { result } = renderHook(() => hooks.useOrders());
    await waitFor(() => expect(result.current.orders).toHaveLength(16));

    act(() => {
      store.saveOrder({ ...base, id: 9999, code: "DLF-TEST-9999" });
    });

    await waitFor(() => {
      expect(result.current.orders).toHaveLength(17);
      expect(result.current.orders[0].code).toBe("DLF-TEST-9999");
    });
  });
});
