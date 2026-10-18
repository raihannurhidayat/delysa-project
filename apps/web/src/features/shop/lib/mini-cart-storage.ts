import type { MiniCartLine, CartCoupon } from "~/features/shop/types";

const STORAGE_KEY_V1 = "delysa:mini-cart:v1";
const STORAGE_KEY_V2 = "delysa:cart:v2";

export type StoredCartState = {
  lines: MiniCartLine[];
  saved: MiniCartLine[];
  coupon?: CartCoupon | null;
  instructions?: string;
};

/** Muat state keranjang v2 dari localStorage; fallback migrasi v1. */
export function loadCartState(): StoredCartState | null {
  if (typeof window === "undefined") return null;
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed: unknown = JSON.parse(rawV2);
      if (isStoredCartState(parsed)) return parsed;
    }
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsed: unknown = JSON.parse(rawV1);
      if (Array.isArray(parsed)) {
        const migrated: StoredCartState = {
          lines: parsed.filter(isMiniCartLine),
          saved: [],
        };
        saveCartState(migrated);
        return migrated;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function isStoredCartState(v: unknown): v is StoredCartState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.lines) && Array.isArray(o.saved);
}

function isMiniCartLine(v: unknown): v is MiniCartLine {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    typeof o.qty === "number" &&
    typeof o.price === "number"
  );
}

export function saveCartState(state: StoredCartState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
  } catch {
    // kuota penuh / mode privat — abaikan
  }
}

/** Tambah/gabung garis dengan kunci slug+size+wrap+kind (tanpa duplikat). */
export function upsertLine(
  lines: MiniCartLine[],
  line: MiniCartLine,
): MiniCartLine[] {
  const idx = lines.findIndex(
    (l) =>
      l.slug === line.slug &&
      l.sizeId === line.sizeId &&
      l.wrapId === line.wrapId &&
      (l.kind ?? "product") === (line.kind ?? "product"),
  );
  if (idx === -1) return [...lines, line];
  const next = [...lines];
  next[idx] = {
    ...next[idx],
    qty: Math.min(next[idx].qty + line.qty, next[idx].maxQty ?? 10),
    note: line.note ?? next[idx].note,
  };
  return next;
}
