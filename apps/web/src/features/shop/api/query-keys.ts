import type { CatalogQuery } from "~/features/shop/types";

/**
 * Factory query key produk. Semua variabel yang dipakai queryFn
 * wajib masuk ke key (exhaustive-deps) agar cache terisolasi per filter.
 */
export const productQueries = {
  all: ["products"] as const,
  flashSale: () => [...productQueries.all, "flash-sale"] as const,
  bestSellers: () => [...productQueries.all, "best-sellers"] as const,
  newArrivals: () => [...productQueries.all, "new-arrivals"] as const,
  byCategory: (category: string) =>
    [...productQueries.all, "by-category", category] as const,
  filtered: (query: CatalogQuery) =>
    [...productQueries.all, "list", query] as const,
  counts: (query: Omit<CatalogQuery, "category" | "page">) =>
    [...productQueries.all, "counts", query] as const,
};
