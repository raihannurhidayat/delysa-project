import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadMiniCart,
  saveMiniCart,
  upsertLine,
} from "~/features/shop/lib/mini-cart-storage";
import type { MiniCartLine } from "~/features/shop/types";

/**
 * Mini-cart lokal PDP (tanpa Context global — YAGNI, hanya PDP+drawer).
 * Persist ke localStorage, evolusi ke S-04 tinggal ganti adapter.
 */
export function useMiniCart() {
  const [lines, setLines] = useState<MiniCartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    setLines(loadMiniCart());
  }, []);

  const add = useCallback((line: MiniCartLine) => {
    setLines((prev) => {
      const next = upsertLine(prev, line);
      saveMiniCart(next);
      return next;
    });
    setOpen(true);
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines],
  );

  return { lines, isOpen, setOpen, add, subtotal, wishlist, setWishlist };
}
