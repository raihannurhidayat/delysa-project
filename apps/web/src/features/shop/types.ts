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
