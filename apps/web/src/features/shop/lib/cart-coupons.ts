import { z } from "zod";
import type { CartCoupon } from "~/features/shop/types";

export const DEFAULT_COUPON: CartCoupon = {
  code: "DELYSAFIRST",
  label: "Potongan Pengguna Baru",
  amount: 0,
};

export function resolveCoupon(code: string): CartCoupon | null {
  const normalized = code.trim().toUpperCase();
  if (normalized === "DELYSAFIRST") {
    return { code: "DELYSAFIRST", label: "Potongan Pengguna Baru", amount: 0 };
  }
  if (normalized === "DELYSAWISUDA") {
    return { code: "DELYSAWISUDA", label: "Promo Wisuda", amount: 25000 };
  }
  return null;
}

export const couponCodeSchema = z
  .string()
  .trim()
  .min(3, "Kode kupon minimal 3 karakter")
  .max(32, "Kode kupon maksimal 32 karakter")
  .transform((v) => v.toUpperCase());
