import { z } from "zod";

/**
 * Schema form login (client-only tahap ini).
 * Mirror dari `packages/shared/src/schemas.ts:loginSchema`
 * dengan pengetatan: password min 8 + pesan Indonesia.
 * Sinkronisasi penuh via Bridge saat kontrak Auth merge.
 */
export const loginFormSchema = z.object({
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

export type LoginFormValues = z.infer<typeof loginFormSchema>;
