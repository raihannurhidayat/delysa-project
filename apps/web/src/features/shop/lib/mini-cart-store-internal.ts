"use client";

import type {
  MiniCartLine,
  CartCoupon,
  CartSnapshot,
} from "~/features/shop/types";
import {
  loadCartState,
  saveCartState,
} from "~/features/shop/lib/mini-cart-storage";
import { computeCartTotals } from "~/features/shop/lib/cart-totals";
import {
  resolveCoupon,
  DEFAULT_COUPON,
} from "~/features/shop/lib/cart-coupons";
import {
  FREE_SHIPPING_MIN,
  SHIPPING_FLAT,
  lineKey,
} from "~/features/shop/lib/cart-rules";

let storeState: CartSnapshot | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  const stored = loadCartState();
  if (stored) {
    const coupon = stored.coupon === undefined ? DEFAULT_COUPON : stored.coupon;
    storeState = {
      lines: stored.lines,
      saved: stored.saved,
      coupon,
      instructions: stored.instructions ?? "",
    };
  } else {
    storeState = {
      lines: [],
      saved: [],
      coupon: DEFAULT_COUPON,
      instructions: "",
    };
  }
  try {
    saveCartState({
      lines: storeState.lines,
      saved: storeState.saved,
      coupon: storeState.coupon,
      instructions: storeState.instructions,
    });
  } catch {
    // ignore quota
  }
}

export function getServerSnapshot(): CartSnapshot {
  return { lines: [], saved: [], coupon: DEFAULT_COUPON, instructions: "" };
}

export function getSnapshot(): CartSnapshot {
  if (!initialized && typeof window !== "undefined") {
    hydrate();
  }
  return storeState ?? getServerSnapshot();
}

export function subscribe(listener: () => void): () => void {
  if (typeof window !== "undefined") {
    hydrate();
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function mutate(fn: (s: CartSnapshot) => CartSnapshot) {
  if (!initialized && typeof window !== "undefined") {
    hydrate();
  }
  storeState = fn(storeState ?? getServerSnapshot());
  if (typeof window !== "undefined") {
    try {
      saveCartState({
        lines: storeState.lines,
        saved: storeState.saved,
        coupon: storeState.coupon,
        instructions: storeState.instructions,
      });
    } catch {
      // ignore quota
    }
  }
  notify();
}

export function addLine(line: MiniCartLine): void {
  mutate((state) => {
    const existingIdx = state.lines.findIndex(
      (l) =>
        l.slug === line.slug &&
        l.sizeId === line.sizeId &&
        l.wrapId === line.wrapId &&
        (l.kind ?? "product") === (line.kind ?? "product"),
    );
    let newLines: MiniCartLine[];
    if (existingIdx >= 0) {
      newLines = [...state.lines];
      newLines[existingIdx] = {
        ...newLines[existingIdx],
        qty: Math.min(
          newLines[existingIdx].qty + line.qty,
          newLines[existingIdx].maxQty ?? 10,
        ),
        note: line.note ?? newLines[existingIdx].note,
      };
    } else {
      newLines = [...state.lines, { ...line, maxQty: line.maxQty ?? 10 }];
    }
    return { ...state, lines: newLines };
  });
}

export function updateLineQty(key: string, qty: number): void {
  mutate((state) => {
    const idx = state.lines.findIndex((l) => lineKey(l) === key);
    if (idx === -1) return state;
    const line = state.lines[idx];
    const max = line.maxQty ?? 10;
    const clamped = Math.min(Math.max(1, qty), max);
    if (clamped === line.qty) return state;
    const newLines = [...state.lines];
    newLines[idx] = { ...line, qty: clamped };
    return { ...state, lines: newLines };
  });
}

export function removeLines(keys: string[]): void {
  mutate((state) => ({
    ...state,
    lines: state.lines.filter((l) => !keys.includes(lineKey(l))),
  }));
}

export function saveForLater(key: string): void {
  mutate((state) => {
    const idx = state.lines.findIndex((l) => lineKey(l) === key);
    if (idx === -1) return state;
    const line = state.lines[idx];
    const newLines = state.lines.filter((_, i) => i !== idx);
    return {
      ...state,
      lines: newLines,
      saved: [...state.saved, line],
    };
  });
}

export function moveToCart(key: string): void {
  mutate((state) => {
    const idx = state.saved.findIndex((l) => lineKey(l) === key);
    if (idx === -1) return state;
    const line = state.saved[idx];
    const newSaved = state.saved.filter((_, i) => i !== idx);
    return {
      ...state,
      lines: [...state.lines, line],
      saved: newSaved,
    };
  });
}

export function removeSaved(key: string): void {
  mutate((state) => ({
    ...state,
    saved: state.saved.filter((l) => lineKey(l) !== key),
  }));
}

export function applyCoupon(
  code: string,
): { ok: true; coupon: CartCoupon } | { ok: false; error: string } {
  const coupon = resolveCoupon(code);
  if (!coupon) {
    return { ok: false, error: "Kode kupon tidak valid" };
  }
  mutate((state) => ({ ...state, coupon }));
  return { ok: true, coupon };
}

export function removeCoupon(): void {
  mutate((state) => ({ ...state, coupon: null }));
}

export function setInstructions(text: string): void {
  mutate((state) => ({ ...state, instructions: text.slice(0, 300) }));
}

/** Kosongkan keranjang setelah pesanan berhasil dibuat. */
export function clearCart(): void {
  mutate((state) => ({ ...state, lines: [], coupon: null }));
}
