import { useEffect, useMemo, useState } from "react";
import { useOrders } from "~/features/shop/hooks/use-orders";
import type { OrderRecord } from "~/features/shop/types";
import { enrichAdminOrders } from "../lib/pesanan/admin-order-enrichment";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

/**
 * Orders dari store shop + field dummy admin (enrichment deterministik).
 * `mounted` menghindari mismatch hydration: SSR merender skeleton dulu.
 */
export function useAdminOrders(): {
  orders: AdminOrderView[];
  mounted: boolean;
} {
  const [mounted, setMounted] = useState(false);
  const { orders } = useOrders();

  useEffect(() => setMounted(true), []);

  const enriched = useMemo(
    () => enrichAdminOrders(orders as OrderRecord[]),
    [orders],
  );

  return { orders: enriched, mounted };
}
