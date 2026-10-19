import type { MiniCartLine } from "~/features/shop/types";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import type { OrderCreateInput, PaymentProofInput } from "@delysa/shared";

export type CheckoutStep = "review" | "alamat" | "bayar" | "ringkasan";

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
