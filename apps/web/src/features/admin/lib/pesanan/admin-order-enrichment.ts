import type { OrderRecord } from "~/features/shop/types";
import type { AdminOrderBatch, AdminOrderView } from "./admin-order.types";

/** Hash deterministik dari teks kode order — dipakai untuk field dummy admin. */
export function hashOrderCode(code: string): number {
  let total = 0;
  for (let index = 0; index < code.length; index += 1) {
    total += code.charCodeAt(index);
  }
  return total;
}

const SLA_BREACH_MINUTES = 90;
const BATCH_THRESHOLD = 3;

/**
 * Menambahkan field dummy deterministik (batch UNSIL, prioritas, SLA, meja
 * florist, kurir) di atas `OrderRecord` — tanpa memutasi record asli dan tanpa
 * persist ke store. Nilai stabil untuk kode yang sama.
 */
export function enrichAdminOrder(
  order: OrderRecord,
  now: Date = new Date(),
): AdminOrderView {
  const hash = hashOrderCode(order.code);
  const batch: AdminOrderBatch | undefined =
    hash % BATCH_THRESHOLD === 0 ? "unsil" : undefined;
  const ageMinutes = (now.getTime() - Date.parse(order.createdAt)) / 60_000;
  const slaBreached =
    order.status === "pending_verification" && ageMinutes > SLA_BREACH_MINUTES;
  const workbench =
    order.status === "processing"
      ? `Meja Florist ${(hash % 3) + 1}`
      : undefined;
  const courierLabel =
    order.status === "shipped"
      ? (order.courier ?? "Kurir Atelier: Dedi S.")
      : undefined;
  const paymentKind =
    order.payment.methodId === "qris"
      ? "instant"
      : order.payment.bank
        ? "manual"
        : "invoice";

  return {
    ...order,
    batch,
    priority:
      batch !== undefined && order.status === "pending_verification"
        ? "prioritas"
        : "normal",
    slaBreached,
    workbench,
    courierLabel,
    paymentKind,
  };
}

export function enrichAdminOrders(
  orders: OrderRecord[],
  now: Date = new Date(),
): AdminOrderView[] {
  return orders.map((order) => enrichAdminOrder(order, now));
}
