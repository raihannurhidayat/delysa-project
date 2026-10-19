import { useSyncExternalStore } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  addLine,
  updateLineQty,
  removeLines,
  saveForLater,
  moveToCart,
  removeSaved,
  applyCoupon,
  removeCoupon,
  setInstructions,
} from "~/features/shop/lib/mini-cart-store";
import type {
  MiniCartLine,
  CartCoupon,
  CartSnapshot,
} from "~/features/shop/types";
import { computeCartTotals } from "~/features/shop/lib/cart-totals";

export function useMiniCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const [isOpen, setOpen] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  const lines = snapshot.lines;
  const saved = snapshot.saved;
  const coupon = snapshot.coupon;
  const instructions = snapshot.instructions;

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines],
  );

  const totals = useMemo(
    () => computeCartTotals(lines, coupon),
    [lines, coupon],
  );

  const add = useCallback((line: MiniCartLine) => {
    addLine(line);
    setOpen(true);
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    updateLineQty(key, qty);
  }, []);

  const remove = useCallback((key: string) => {
    removeLines([key]);
  }, []);

  const removeMany = useCallback((keys: string[]) => {
    removeLines(keys);
  }, []);

  const saveForLaterFn = useCallback((key: string) => {
    saveForLater(key);
  }, []);

  const moveToCartFn = useCallback((key: string) => {
    moveToCart(key);
  }, []);

  const removeSavedFn = useCallback((key: string) => {
    removeSaved(key);
  }, []);

  const applyCouponFn = useCallback((code: string) => applyCoupon(code), []);

  const removeCouponFn = useCallback(() => {
    removeCoupon();
  }, []);

  const setInstructionsFn = useCallback((text: string) => {
    setInstructions(text);
  }, []);

  return {
    lines,
    saved,
    coupon,
    instructions,
    count,
    subtotal,
    totals,
    isOpen,
    setOpen,
    wishlist,
    setWishlist,
    add,
    updateQty,
    remove,
    removeMany,
    saveForLater: saveForLaterFn,
    moveToCart: moveToCartFn,
    removeSaved: removeSavedFn,
    applyCoupon: applyCouponFn,
    removeCoupon: removeCouponFn,
    setInstructions: setInstructionsFn,
  };
}
