/** Konstanta bersama FE+BE. Satu sumber kebenaran — mirror di Laravel via enum/const. */
export const ROLES = ["customer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "pending_payment",
  "pending_verification",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["manual_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "verified", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const LOW_STOCK_DEFAULT = 5;
