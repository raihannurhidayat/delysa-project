import { z } from "zod";

import {
  CHECKOUT_STEPS,
  PAYMENT_METHOD_IDS,
  type CheckoutFormData,
} from "~/features/shop/types";

export type { CheckoutFormData };

export const checkoutStepSchema = z.enum(CHECKOUT_STEPS);

/**
 * Query URL `/checkout?step=...`. Seluruh objek search divalidasi, jadi
 * `.catch()` dipasang pada field `step` (bukan pada skema enum) agar nilai
 * tak valid/absen jatuh ke langkah `review`, bukan error boundary.
 */
export const checkoutSearchSchema = z.object({
  step: checkoutStepSchema.catch("review"),
});

export type CheckoutSearch = z.infer<typeof checkoutSearchSchema>;

export const alamatStepFields = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, { message: "Nama penerima minimal 2 karakter" })
    .max(100, { message: "Nama penerima maksimal 100 karakter" }),
  recipientPhone: z
    .string()
    .trim()
    .min(9, { message: "Nomor HP minimal 9 digit" })
    .max(20, { message: "Nomor HP maksimal 20 digit" })
    .regex(/^[0-9+\-\s]+$/, {
      message: "Nomor HP hanya boleh berisi angka",
    }),
  buyerPhoneSameAsRecipient: z.boolean().default(true),
  buyerPhone: z.string().trim().max(20).optional(),
  shippingAddress: z
    .string()
    .trim()
    .min(10, { message: "Alamat minimal 10 karakter" })
    .max(500, { message: "Alamat maksimal 500 karakter" }),
  customNote: z.string().max(500, { message: "Catatan maksimal 500 karakter" }),
});

function refineBuyerPhone(
  data: { buyerPhoneSameAsRecipient?: boolean; buyerPhone?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.buyerPhoneSameAsRecipient === false) {
    const phone = (data.buyerPhone ?? "").trim();
    if (phone.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["buyerPhone"],
        message: "Nomor HP pemesan minimal 9 digit",
      });
    } else if (!/^[0-9+\-\s]+$/.test(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["buyerPhone"],
        message: "Nomor HP pemesan hanya boleh berisi angka",
      });
    }
  }
}

export const alamatStepSchema = alamatStepFields.superRefine(refineBuyerPhone);

export const bayarStepSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHOD_IDS, {
    errorMap: () => ({ message: "Pilih metode pembayaran" }),
  }),
});

export const ringkasanStepSchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Harap centang konfirmasi pesanan" }),
  }),
});

export const checkoutFormSchema = z
  .discriminatedUnion("step", [
    z.object({ step: z.literal("review") }),
    z.object({ step: z.literal("alamat") }).merge(alamatStepFields),
    z.object({ step: z.literal("bayar") }).merge(bayarStepSchema),
    z.object({ step: z.literal("ringkasan") }).merge(ringkasanStepSchema),
  ])
  .superRefine((data, ctx) => {
    if (data.step === "alamat") {
      refineBuyerPhone(data, ctx);
    }
  });

export const DEFAULT_CHECKOUT_FORM: CheckoutFormData = {
  step: "review",
  recipientName: "",
  recipientPhone: "",
  buyerPhoneSameAsRecipient: true,
  buyerPhone: "",
  shippingAddress: "",
  customNote: "",
  paymentMethod: "",
  confirmed: false,
};
