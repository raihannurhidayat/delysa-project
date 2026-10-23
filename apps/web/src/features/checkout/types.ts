import type { MiniCartLine } from "~/features/shop/types";
import type { CartTotals } from "~/features/shop/lib/cart-totals";

export const CHECKOUT_STEPS = [
  "review",
  "alamat",
  "bayar",
  "ringkasan",
] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

export const CHECKOUT_STEP_LABELS: Record<CheckoutStep, string> = {
  review: "Review Keranjang",
  alamat: "Alamat Pengiriman",
  bayar: "Metode Pembayaran",
  ringkasan: "Ringkasan & Bayar",
};

export const CHECKOUT_STEP_SHORT_LABELS: Record<CheckoutStep, string> = {
  review: "Keranjang",
  alamat: "Alamat",
  bayar: "Bayar",
  ringkasan: "Ringkasan",
};

export const PAYMENT_METHOD_IDS = ["manual_transfer_bca", "qris"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_IDS)[number];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHOD_IDS as readonly string[]).includes(value)
  );
}

export type CheckoutFormData = {
  step: CheckoutStep;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote: string;
  paymentMethod: PaymentMethod | "";
  confirmed: boolean;
};

export type CheckoutDraft = CheckoutFormData & {
  guestToken: string;
  updatedAt: number;
};

export type CheckoutContext = {
  cartLines: MiniCartLine[];
  cartTotals: CartTotals;
  isGuest: boolean;
  guestToken: string;
  userAddress?: { name: string; phone: string; address: string };
};
