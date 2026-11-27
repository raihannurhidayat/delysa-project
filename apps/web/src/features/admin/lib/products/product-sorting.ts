import type { SortingState } from "@tanstack/react-table";

export type ProductSortKey =
  | "default"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "stock-desc"
  | "sales-desc"
  | "rating-desc";

export const PRODUCT_SORT_OPTIONS: { value: ProductSortKey; label: string }[] =
  [
    { value: "default", label: "Urutan default" },
    { value: "name-asc", label: "Nama A–Z" },
    { value: "name-desc", label: "Nama Z–A" },
    { value: "price-asc", label: "Harga terendah" },
    { value: "price-desc", label: "Harga tertinggi" },
    { value: "stock-asc", label: "Stok tersedikit" },
    { value: "stock-desc", label: "Stok terbanyak" },
    { value: "sales-desc", label: "Terjual terbanyak" },
    { value: "rating-desc", label: "Rating tertinggi" },
  ];

const SORT_KEY_TO_STATE: Record<
  Exclude<ProductSortKey, "default">,
  SortingState
> = {
  "name-asc": [{ id: "name", desc: false }],
  "name-desc": [{ id: "name", desc: true }],
  "price-asc": [{ id: "price", desc: false }],
  "price-desc": [{ id: "price", desc: true }],
  "stock-asc": [{ id: "stock", desc: false }],
  "stock-desc": [{ id: "stock", desc: true }],
  "sales-desc": [{ id: "sales", desc: true }],
  "rating-desc": [{ id: "rating", desc: true }],
};

export function sortKeyToState(key: ProductSortKey): SortingState {
  return key === "default" ? [] : SORT_KEY_TO_STATE[key];
}

/** Mengembalikan "default" bila kolom diurutkan lewat header dan tidak ada di daftar opsi. */
export function sortStateToKey(sorting: SortingState): ProductSortKey {
  const first = sorting[0];
  if (!first) return "default";

  const match = (
    Object.keys(SORT_KEY_TO_STATE) as Exclude<ProductSortKey, "default">[]
  ).find((key) => {
    const state = SORT_KEY_TO_STATE[key];
    return state[0]?.id === first.id && state[0]?.desc === first.desc;
  });

  return match ?? "default";
}
