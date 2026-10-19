import type { MiniCartLine, CartCoupon } from "~/features/shop/types";
import {
  FREE_SHIPPING_MIN,
  SHIPPING_FLAT,
} from "~/features/shop/lib/cart-rules";

export type CartTotals = {
  itemCount: number;
  subtotalNormal: number;
  productDiscount: number;
  subtotal: number;
  shipping: number;
  packaging: number;
  couponDiscount: number;
  grandTotal: number;
  freeShipping: boolean;
  remainingForFree: number;
};

export function computeCartTotals(
  lines: MiniCartLine[],
  coupon: CartCoupon | null,
): CartTotals {
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const subtotalNormal = lines.reduce((sum, l) => {
    const original = l.originalPrice ?? l.price;
    return sum + original * l.qty;
  }, 0);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const productDiscount = subtotalNormal - subtotal;

  const freeShipping = subtotal >= FREE_SHIPPING_MIN;
  const shipping = freeShipping ? 0 : SHIPPING_FLAT;
  const remainingForFree = freeShipping ? 0 : FREE_SHIPPING_MIN - subtotal;

  const packaging = 0;
  const couponDiscount = coupon?.amount ?? 0;

  const grandTotal = subtotal + shipping + packaging - couponDiscount;

  return {
    itemCount,
    subtotalNormal,
    productDiscount,
    subtotal,
    shipping,
    packaging,
    couponDiscount,
    grandTotal: Math.max(0, grandTotal),
    freeShipping,
    remainingForFree,
  };
}
