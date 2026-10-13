import productsJson from "~/mock/products.json";
import type { CatalogItem } from "~/features/shop/types";

export const CATALOG_CATEGORIES: string[] = [
  "Wisuda",
  "Mawar",
  "Anggrek",
  "Kado",
  "Papan",
  "Meja",
];

export type PricePreset = {
  label: string;
  min?: number;
  max?: number;
};

export const CATALOG_PRICE_PRESETS: PricePreset[] = [
  { label: "< Rp100rb", max: 100000 },
  { label: "Rp100rb - Rp250rb", min: 100000, max: 250000 },
  { label: "Rp250rb - Rp500rb", min: 250000, max: 500000 },
  { label: "> Rp500rb", min: 500000 },
];

/**
 * Dataset dummy katalog dari sumber seragam `src/mock/products.json`.
 * Terpisah dari STOREFRONT_PRODUCTS agar homepage tidak berubah.
 * Stok 0 = disembunyikan dari grid (aturan PRD).
 */
export const CATALOG_PRODUCTS: CatalogItem[] = productsJson;
