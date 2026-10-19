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

export type CheckoutFormData = {
  step: CheckoutStep;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote: string;
  paymentProof: { file: File; preview: string } | null;
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
