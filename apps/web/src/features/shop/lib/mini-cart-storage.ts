import type { MiniCartLine } from "~/features/shop/types";

const STORAGE_KEY = "delysa:mini-cart:v1";

/** Muat garis keranjang dari localStorage (tanpa PII, hanya slug+varian). */
export function loadMiniCart(): MiniCartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is MiniCartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as MiniCartLine).slug === "string" &&
        typeof (l as MiniCartLine).qty === "number",
    );
  } catch {
    return [];
  }
}

export function saveMiniCart(lines: MiniCartLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Kuota penuh / mode privat — abaikan, drawer tetap tampil dari memori.
  }
}

/** Tambah/gabung garis dengan kunci slug+size+wrap (tanpa duplikat). */
export function upsertLine(
  lines: MiniCartLine[],
  line: MiniCartLine,
): MiniCartLine[] {
  const idx = lines.findIndex(
    (l) =>
      l.slug === line.slug &&
      l.sizeId === line.sizeId &&
      l.wrapId === line.wrapId,
  );
  if (idx === -1) return [...lines, line];
  const next = [...lines];
  next[idx] = {
    ...next[idx],
    qty: next[idx].qty + line.qty,
    note: line.note ?? next[idx].note,
  };
  return next;
}
