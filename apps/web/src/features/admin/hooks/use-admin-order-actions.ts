import { updateOrderStatus } from "~/features/shop/lib/order-store";
import type { OrderRecord } from "~/features/shop/types";
import {
  findAction,
  type AdminOrderActionId,
} from "../lib/pesanan/admin-order-transition";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

/**
 * Menerapkan aksi status admin pada order: cari spesifikasi transisi legal,
 * lalu panggil `updateOrderStatus` dari store shop (satu sumber kebenaran).
 * Mengembalikan record terbaru, atau `null` bila aksi ilegal/tidak ditemukan.
 */
export function useAdminOrderActions(): {
  applyAction(
    order: AdminOrderView,
    actionId: AdminOrderActionId,
  ): OrderRecord | null;
} {
  function applyAction(
    order: AdminOrderView,
    actionId: AdminOrderActionId,
  ): OrderRecord | null {
    const action = findAction(actionId, order.status);
    if (!action) return null;

    return updateOrderStatus(order.code, action.target, { note: action.label });
  }

  return { applyAction };
}
