import { ORDER_STATUSES, type OrderStatus } from "@delysa/shared";

export const ORDER_FLOW = [
  "pending_payment",
  "pending_verification",
  "paid",
  "processing",
  "shipped",
  "delivered",
] as const satisfies readonly OrderStatus[];

export type OrderStatusTone =
  "warning" | "info" | "success" | "progress" | "danger" | "neutral";

export type OrderStatusMeta = {
  label: string;
  shortLabel: string;
  description: string;
  tone: OrderStatusTone;
  stepIndex: number | null;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    shortLabel: "Belum Bayar",
    description: "Pesanan menunggu pembayaran sebelum diproses.",
    tone: "warning",
    stepIndex: 0,
  },
  pending_verification: {
    label: "Menunggu Verifikasi",
    shortLabel: "Verifikasi",
    description: "Bukti pembayaran sedang diperiksa admin.",
    tone: "info",
    stepIndex: 1,
  },
  paid: {
    label: "Pembayaran Terverifikasi",
    shortLabel: "Dibayar",
    description: "Pembayaran sudah diverifikasi admin.",
    tone: "success",
    stepIndex: 2,
  },
  processing: {
    label: "Diproses",
    shortLabel: "Diproses",
    description: "Rangkaian pesanan sedang disiapkan.",
    tone: "progress",
    stepIndex: 3,
  },
  shipped: {
    label: "Dikirim",
    shortLabel: "Dikirim",
    description: "Pesanan sedang dalam perjalanan.",
    tone: "progress",
    stepIndex: 4,
  },
  delivered: {
    label: "Selesai",
    shortLabel: "Selesai",
    description: "Pesanan sudah diterima.",
    tone: "success",
    stepIndex: 5,
  },
  cancelled: {
    label: "Dibatalkan",
    shortLabel: "Batal",
    description: "Pesanan dibatalkan.",
    tone: "danger",
    stepIndex: null,
  },
  rejected: {
    label: "Ditolak",
    shortLabel: "Ditolak",
    description: "Pesanan ditolak.",
    tone: "danger",
    stepIndex: null,
  },
};

export function getOrderStatusMeta(status: OrderStatus): OrderStatusMeta {
  return ORDER_STATUS_META[status];
}

export function isClosedOrderStatus(status: OrderStatus): boolean {
  return status === "cancelled" || status === "rejected";
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}
