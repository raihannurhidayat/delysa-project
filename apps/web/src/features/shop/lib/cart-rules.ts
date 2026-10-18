import type { MiniCartLine } from "~/features/shop/types";

export const FREE_SHIPPING_MIN = 200000;
export const SHIPPING_FLAT = 25000;
export const CART_LINE_MAX_DEFAULT = 10;

export function lineKey(
  line: Pick<MiniCartLine, "kind" | "slug" | "sizeId" | "wrapId">,
): string {
  return `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`;
}
