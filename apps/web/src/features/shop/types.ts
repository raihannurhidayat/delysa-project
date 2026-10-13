export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  sold: number;
  category: string;
  isNew?: boolean;
  /** Harga asli sebelum diskon (untuk harga coret). Opsional, hanya untuk promo. */
  originalPrice?: number;
  /** Persen diskon 1-90, mis. 35 untuk "-35%". Opsional. */
  discountPercent?: number;
  /** Sisa stok promo untuk label "Tersisa X item". Opsional. */
  stockLeft?: number;
  /** Total stok promo untuk progress bar. Opsional. */
  stockTotal?: number;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  count: number;
};

export type Faq = {
  question: string;
  answer: string;
};

export type Review = {
  name: string;
  product: string;
  rating: number;
  text: string;
};

export type CatalogItem = Product & {
  /** Stok tersedia. 0 = disembunyikan dari grid katalog. */
  stock: number;
  /** Jumlah ulasan untuk label "(N ulasan)". */
  reviewCount: number;
  /** Label pita di foto, mis. "TERLARIS WISUDA". Opsional. */
  badge?: string;
};

/**
 * Bentuk produk seragam untuk `CardProduct` (sumber: `src/mock/products.json`).
 * Semua field varian opsional sehingga `Product` maupun `CatalogItem`
 * assignable tanpa mapping.
 */
export type UnifiedProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  sold: number;
  category: string;
  isNew?: boolean;
  originalPrice?: number;
  discountPercent?: number;
  stockLeft?: number;
  stockTotal?: number;
  stock?: number;
  reviewCount?: number;
  badge?: string;
};

export type CatalogSortKey = "termurah" | "termahal" | "terbaru";

export type CatalogQuery = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSortKey;
  page: number;
};

export type CatalogResult = {
  items: CatalogItem[];
  total: number;
  pageCount: number;
};

/** Ukuran halaman katalog prototype (PRD 20/page berlaku saat BE paginasi). */
export const CATALOG_PAGE_SIZE = 12;
