import {
  STOREFRONT_CATEGORIES,
  STOREFRONT_FAQS,
  STOREFRONT_PRODUCTS,
  STOREFRONT_REVIEWS,
} from "~/features/shop/data/storefront";

/**
 * Seam data storefront. Kini: mock sync (SSR penuh, LCP cepat).
 * Nanti: ganti isi dengan `useQuery` ke BE tanpa mengubah pemanggil.
 */
export function useStorefrontData() {
  return {
    products: STOREFRONT_PRODUCTS,
    categories: STOREFRONT_CATEGORIES,
    faqs: STOREFRONT_FAQS,
    reviews: STOREFRONT_REVIEWS,
    isPending: false,
    isError: false,
  };
}
