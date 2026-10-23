import { z } from "zod";

/** Validasi input di batas sistem (FE form + BE FormRequest mirror). */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const checkoutSchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().min(9).max(20),
  shippingAddress: z.string().min(10).max(500),
  customNote: z.string().max(500).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const orderCreateSchema = z.object({
  recipientName: z.string().min(2).max(100),
  recipientPhone: z.string().min(9).max(20),
  shippingAddress: z.string().min(10).max(500),
  customNote: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid(),
});

export const paymentProofSchema = z.object({
  orderId: z.number().int().positive(),
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .max(5 * 1024 * 1024),
  fileType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

export const checkoutStepSchemas = {
  step1_review: z.object({}),
  step2_alamat: z.object({
    recipientName: z.string().min(2).max(100),
    recipientPhone: z.string().min(9).max(20),
    shippingAddress: z.string().min(10).max(500),
    customNote: z.string().max(500).optional(),
  }),
  step3_bayar: z.object({
    paymentProof: z
      .object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      })
      .optional(),
  }),
  step4_ringkasan: z.object({
    confirmed: z.literal(true),
  }),
};

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
