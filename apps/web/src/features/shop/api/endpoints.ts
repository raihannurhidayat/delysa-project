import { apiFetch, isMockMode } from "~/features/shop/api/http";
import {
  applyCatalogFilters,
  countCatalogByCategory,
  mockGet,
} from "~/features/shop/api/mock";
import type {
  CatalogItem,
  CatalogQuery,
  UnifiedProduct,
} from "~/features/shop/types";

export type ProductsListResult = {
  items: UnifiedProduct[];
  total: number;
};

function toCatalogItems(items: UnifiedProduct[]): CatalogItem[] {
  return items as CatalogItem[];
}

export function getFlashSaleProducts(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/flash-sale", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/flash-sale", signal);
}

export function getBestSellers(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/best-sellers", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/best-sellers", signal);
}

export function getNewArrivals(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/new-arrivals", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/new-arrivals", signal);
}

export function getProductsByCategory(
  category: string,
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/by-category", signal).then(
      (pool) => pool.filter((p) => p.category === category),
    );
  }
  return apiFetch<UnifiedProduct[]>(
    `/products/by-category?category=${encodeURIComponent(category)}`,
    signal,
  );
}

export async function getProducts(
  query: CatalogQuery,
  signal?: AbortSignal,
): Promise<ProductsListResult> {
  if (isMockMode()) {
    const pool = await mockGet<UnifiedProduct[]>("/products", signal);
    const { items, total } = applyCatalogFilters(
      toCatalogItems(pool),
      query,
    );
    return { items, total };
  }
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  params.set("page", String(query.page));
  return apiFetch<ProductsListResult>(`/products?${params.toString()}`, signal);
}

export async function getCategoryCounts(
  query: Omit<CatalogQuery, "category" | "page">,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  if (isMockMode()) {
    const pool = await mockGet<UnifiedProduct[]>("/products", signal);
    return countCatalogByCategory(toCatalogItems(pool), query);
  }
  // Kontrak BE belum menyediakan facet counts (gap CP-57): hitung dari
  // halaman list sebagai best-effort.
  const { items } = await getProducts(
    { ...query, category: undefined, page: 1 },
    signal,
  );
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  return counts;
}
