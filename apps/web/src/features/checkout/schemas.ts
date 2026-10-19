import { z } from "zod";
import { checkoutSchema } from "@delysa/shared";

export type CheckoutFormData = {
  step: "review" | "alamat" | "bayar" | "ringkasan";
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote: string;
  paymentProof: { file: File; preview: string } | null;
  confirmed: boolean;
};

export const checkoutStepSchema = z.enum([
  "review",
  "alamat",
  "bayar",
  "ringkasan",
]);

export const alamatStepSchema = checkoutSchema.pick({
  recipientName: true,
  recipientPhone: true,
  shippingAddress: true,
  customNote: true,
});

export const bayarStepSchema = z.object({
  paymentProof: z
    .object({
      file: z.instanceof(File),
      preview: z.string(),
    })
    .nullable(),
});

export const ringkasanStepSchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Harap centang konfirmasi" }),
  }),
});

export const checkoutFormSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("review") }).merge(z.object({})),
  z.object({ step: z.literal("alamat") }).merge(alamatStepSchema),
  z.object({ step: z.literal("bayar") }).merge(bayarStepSchema),
  z.object({ step: z.literal("ringkasan") }).merge(ringkasanStepSchema),
]);

export const DEFAULT_CHECKOUT_FORM: CheckoutFormData = {
  step: "review",
  recipientName: "",
  recipientPhone: "",
  shippingAddress: "",
  customNote: "",
  paymentProof: null,
  confirmed: false,
};
