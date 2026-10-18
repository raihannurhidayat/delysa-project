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
  /** Sisa stok promo. Disimpan di data, tidak ditampilkan di kartu. Opsional. */
  stockLeft?: number;
  /** Total stok promo untuk progress bar. Opsional. */
  stockTotal?: number;
  /** True bila produk sedang flash sale (ditampilkan di section flash sale). Opsional. */
  isFlashSale?: boolean;
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
  /** Jumlah ulasan. Disimpan di data, tidak ditampilkan di kartu. */
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
  isFlashSale?: boolean;
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

export type ProductSizeOption = {
  id: string;
  label: string;
  stems?: string;
  /** Selisih terhadap harga dasar (bisa negatif untuk ukuran lebih kecil). */
  priceDelta: number;
};

export type ProductWrapOption = {
  id: string;
  label: string;
  sub?: string;
  priceDelta?: number;
};

export type ProductReviewItem = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  variant: string;
  text: string;
  verified: boolean;
  helpful: number;
};

/**
 * Detail produk untuk PDP `/products/$slug` (tipe FE lokal tahap mock-only).
 * Kontrak BE `GET /products/{slug}` belum ada di `openapi.yaml`
 * ("tidak terverifikasi") — evolusi BE tinggal ganti isi
 * `getProductBySlug` tanpa mengubah tipe ini.
 */
export type ProductDetail = UnifiedProduct & {
  stock: number;
  reviewCount: number;
  badge?: string;
  gallery: string[];
  description: string;
  care: string[];
  specs: { label: string; value: string }[];
  shipping: string[];
  sizes: ProductSizeOption[];
  wraps: ProductWrapOption[];
  ratingBreakdown: { stars: number; pct: number }[];
  reviews: ProductReviewItem[];
};

export type MiniCartLine = {
  slug: string;
  name: string;
  image: string;
  sizeId: string;
  sizeLabel: string;
  wrapId: string;
  price: number;
  qty: number;
  note?: string;
};
