import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
} from "~/features/shop/lib/mini-cart-store-internal";

export { subscribe, getSnapshot, getServerSnapshot };

export {
  addLine,
  updateLineQty,
  removeLines,
  saveForLater,
  moveToCart,
  removeSaved,
  applyCoupon,
  removeCoupon,
  setInstructions,
  clearCart,
} from "~/features/shop/lib/mini-cart-store-internal";

export type {
  CartSnapshot,
  MiniCartLine,
  CartCoupon,
} from "~/features/shop/types";
