import { z } from "zod";

/**
 * Schema form register (client-only tahap ini).
 * Mirror dari `packages/shared/src/schemas.ts:registerSchema`
 * dengan pesan Indonesia. Sinkronisasi penuh via Bridge saat
 * kontrak Auth merge.
 */
export const registerFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Masukkan email yang valid")
    .max(255, "Email maksimal 255 karakter"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
