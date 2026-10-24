import { useMemo, useSyncExternalStore } from "react";
import {
  findOrderByCode,
  getOrderServerSnapshot,
  getOrderSnapshot,
  subscribeOrders,
} from "~/features/shop/lib/order-store";

export function useOrders() {
  return useSyncExternalStore(
    subscribeOrders,
    getOrderSnapshot,
    getOrderServerSnapshot,
  );
}

export function useOrder(code: string) {
  const state = useOrders();
  return useMemo(
    () => findOrderByCode(state.orders, code),
    [state.orders, code],
  );
}
