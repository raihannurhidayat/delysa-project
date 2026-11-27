import { z } from "zod";
import type { OrderRecord } from "~/features/shop/types";
import { computeCartTotals } from "~/features/shop/lib/cart-totals";
import { getPaymentMethod } from "~/features/shop/lib/payment-methods";
import type { MiniCartLine } from "~/features/shop/types";

/** Kode order manual: `DLF-YYYYMMDD-XXXX` — contoh kontrak: `DLF-20261019-ABCD`. */
export function generateManualOrderCode(now: Date): string {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return `DLF-${stamp}-${suffix}`;
}

export const MANUAL_ORDER_FORM_SCHEMA = z.object({
  itemName: z.string().min(2, "Nama produk minimal 2 karakter").max(100).trim(),
  itemQty: z.coerce
    .number()
    .int("Jumlah harus angka bulat")
    .min(1, "Jumlah minimal 1")
    .max(99, "Jumlah maksimal 99"),
  itemPrice: z.coerce
    .number()
    .int("Harga harus angka bulat")
    .min(1, "Harga wajib diisi"),
  recipientName: z
    .string()
    .min(2, "Nama penerima minimal 2 karakter")
    .max(100)
    .trim(),
  recipientPhone: z
    .string()
    .min(9, "Nomor telepon minimal 9 digit")
    .max(20)
    .trim(),
  shippingAddress: z
    .string()
    .min(10, "Alamat minimal 10 karakter")
    .max(500)
    .trim(),
  customNote: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type ManualOrderFormValues = z.output<typeof MANUAL_ORDER_FORM_SCHEMA>;

/** Enum slug sederhana: huruf diturunkan ke mesin, spasi menjadi - z. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** Merakit `OrderRecord` pesanan manual: 1 item, Bank BCA, status pembayaran masih pending. */
export function createManualOrderRecord(
  values: ManualOrderFormValues,
  code: string,
  now: Date = new Date(),
): OrderRecord {
  const createdAt = now.toISOString();
  const line: MiniCartLine = {
    slug: slugify(values.itemName) || "item-manual",
    name: values.itemName,
    image: "",
    sizeId: "",
    sizeLabel: "",
    wrapId: "",
    price: values.itemPrice,
    qty: values.itemQty,
    kind: "product",
  };
  const method = getPaymentMethod("manual_transfer_bca");

  if (!method) {
    throw new Error("Metode pembayaran manual BCA tidak ditemukan");
  }

  return {
    id: Date.now(),
    code: code.toUpperCase(),
    status: "pending_payment",
    createdAt,
    updatedAt: createdAt,
    paymentDeadline: new Date(now.getTime() + 86_400_000).toISOString(),
    recipientName: values.recipientName,
    recipientPhone: values.recipientPhone,
    shippingAddress: values.shippingAddress,
    customNote: values.customNote || undefined,
    items: [line],
    totals: computeCartTotals([line], null),
    payment: {
      methodId: method.id,
      label: method.label,
      description: method.description,
      bank: method.bank ? { ...method.bank } : undefined,
      steps: [...method.steps],
    },
    timeline: [
      {
        status: "pending_payment",
        at: createdAt,
        note: "Pesanan dibuat oleh admin",
      },
    ],
  };
}
