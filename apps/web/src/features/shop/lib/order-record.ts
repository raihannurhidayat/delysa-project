import type { OrderRecord, MiniCartLine } from "~/features/shop/types";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import { getPaymentMethod } from "~/features/shop/lib/payment-methods";
import type { OrderResponse } from "~/features/shop/api/endpoints";
import type { CheckoutFormData } from "~/features/shop/types";

export function buildOrderRecord({
  order,
  form,
  lines,
  totals,
  now = new Date(),
}: {
  order: OrderResponse;
  form: CheckoutFormData;
  lines: MiniCartLine[];
  totals: CartTotals;
  now?: Date;
}): OrderRecord {
  const createdAt = now.toISOString();
  const method = getPaymentMethod(form.paymentMethod);

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    createdAt,
    updatedAt: createdAt,
    paymentDeadline: new Date(now.getTime() + 86_400_000).toISOString(),
    recipientName: form.recipientName,
    recipientPhone: form.recipientPhone,
    shippingAddress: form.shippingAddress,
    customNote: form.customNote || undefined,
    items: lines.map((line) => ({ ...line })),
    totals: { ...totals },
    payment: {
      methodId: method?.id ?? "",
      label: method?.label ?? "Metode pembayaran belum tercatat",
      description: method?.description ?? "",
      bank: method?.bank ? { ...method.bank } : undefined,
      steps: method?.steps ? [...method.steps] : [],
    },
    timeline: [{ status: order.status, at: createdAt, note: "Pesanan dibuat" }],
  };
}
