import type { OrderStatus } from "@delysa/shared";
import { getOrderStatusMeta } from "~/features/shop/lib/order-status";

export type AdminOrderActionId =
  "verify" | "reject" | "start-assembly" | "mark-shipped" | "mark-delivered";

export type AdminOrderActionSpec = {
  id: AdminOrderActionId;
  label: string;
  target: OrderStatus;
  variant: "default" | "destructive";
};

type StatusMeta = Record<AdminOrderActionId, AdminOrderActionSpec>;

const ACTIONS: Record<string, readonly AdminOrderActionSpec[]> = {
  pending_payment: [],
  pending_verification: [
    {
      id: "verify",
      label: "Verifikasi",
      target: "paid",
      variant: "default",
    },
    {
      id: "reject",
      label: "Tolak",
      target: "rejected",
      variant: "destructive",
    },
  ],
  paid: [
    {
      id: "start-assembly",
      label: "Mulai Rakit",
      target: "processing",
      variant: "default",
    },
  ],
  processing: [
    {
      id: "mark-shipped",
      label: "Tandai Dikirim",
      target: "shipped",
      variant: "default",
    },
  ],
  shipped: [
    {
      id: "mark-delivered",
      label: "Tandai Selesai",
      target: "delivered",
      variant: "default",
    },
  ],
  delivered: [],
  cancelled: [],
  rejected: [],
} satisfies Record<OrderStatus, readonly AdminOrderActionSpec[]>;

/** Aksi status legal per status order — hanya transisi ke depan dari `ORDER_STATUSES`. */
export function getAdminOrderActions(
  status: OrderStatus,
): readonly AdminOrderActionSpec[] {
  return ACTIONS[status] ?? [];
}

export function findAction(
  id: AdminOrderActionId,
  status: OrderStatus,
): AdminOrderActionSpec | null {
  const action =
    getAdminOrderActions(status).find((candidate) => candidate.id === id) ??
    null;
  return action;
}

/** Nama aksi yang tercatat di timeline saat status dipromosikan admin. */
export function actionTimelineNote(action: AdminOrderActionSpec): string {
  return `Status diubah admin: ${getOrderStatusMeta(action.target).label}`;
}
