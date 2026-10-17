import type {
  ProductSizeOption,
  ProductWrapOption,
} from "~/features/shop/types";

/** Harga akhir = harga dasar + delta ukuran + delta wrapping. */
export function resolveVariantPrice(
  base: number,
  size?: ProductSizeOption,
  wrap?: ProductWrapOption,
): number {
  return base + (size?.priceDelta ?? 0) + (wrap?.priceDelta ?? 0);
}

/** Jepit qty ke [1, max]; max <= 0 → 0 (stok habis). */
export function clampQty(qty: number, max: number): number {
  if (!Number.isFinite(qty)) return 1;
  if (max <= 0) return 0;
  if (qty < 1) return 1;
  if (qty > max) return max;
  return Math.floor(qty);
}

export function formatVariantLabel(sizeLabel?: string, wrapLabel?: string) {
  if (sizeLabel && wrapLabel) return `${sizeLabel} • ${wrapLabel}`;
  return sizeLabel ?? wrapLabel ?? "";
}
