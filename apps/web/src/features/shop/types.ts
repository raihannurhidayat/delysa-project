import type { OrderStatus } from "@delysa/shared";
import type { CartTotals } from "~/features/shop/lib/cart-totals";

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
  bonuses?: string[];
};

export type CartLineKind = "product" | "addon";

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
  kind?: CartLineKind;
  originalPrice?: number;
  bonuses?: string[];
  maxQty?: number;
  wrapLabel?: string;
};

export type CartCoupon = {
  code: string;
  label: string;
  amount: number;
};

export type CartSnapshot = {
  lines: MiniCartLine[];
  saved: MiniCartLine[];
  coupon: CartCoupon | null;
  instructions: string;
};

export const PAYMENT_METHOD_IDS = ["manual_transfer_bca", "qris"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_IDS)[number];

/** Alias untuk snapshot pembayaran pada `OrderRecord`. */
export type OrderPaymentMethod = PaymentMethod;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHOD_IDS as readonly string[]).includes(value)
  );
}

export type OrderPaymentSnapshot = {
  methodId: OrderPaymentMethod | "";
  label: string;
  description: string;
  bank?: { name: string; accountNumber: string; accountName: string };
  steps: readonly string[];
};

export type OrderTimelineEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type OrderRecord = {
  id: number;
  code: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentDeadline: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote?: string;
  items: MiniCartLine[];
  totals: CartTotals;
  payment: OrderPaymentSnapshot;
  timeline: OrderTimelineEvent[];
  courier?: string;
  trackingNumber?: string;
  deliveredAt?: string;
};

export type OrderPeriod = "30d" | "90d" | "1y" | "all";
export type OrderSort = "newest" | "oldest" | "total_desc";
export type OrderTab =
  | "all"
  | "pending_payment"
  | "pending_verification"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "closed";

export const CHECKOUT_STEPS = [
  "review",
  "alamat",
  "bayar",
  "ringkasan",
] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

export const CHECKOUT_STEP_LABELS: Record<CheckoutStep, string> = {
  review: "Review Keranjang",
  alamat: "Alamat Pengiriman",
  bayar: "Metode Pembayaran",
  ringkasan: "Ringkasan & Bayar",
};

export const CHECKOUT_STEP_SHORT_LABELS: Record<CheckoutStep, string> = {
  review: "Keranjang",
  alamat: "Alamat",
  bayar: "Bayar",
  ringkasan: "Ringkasan",
};

export type CheckoutFormData = {
  step: CheckoutStep;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  customNote: string;
  paymentMethod: PaymentMethod | "";
  confirmed: boolean;
};

export type CheckoutDraft = CheckoutFormData & {
  guestToken: string;
  updatedAt: number;
};

export type CheckoutContext = {
  cartLines: MiniCartLine[];
  cartTotals: CartTotals;
  isGuest: boolean;
  guestToken: string;
  userAddress?: { name: string; phone: string; address: string };
};
