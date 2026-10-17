import { ApiError, apiFetch, isMockMode } from "~/features/shop/api/http";
import {
  applyCatalogFilters,
  countCatalogByCategory,
  mockGet,
} from "~/features/shop/api/mock";
import type {
  CatalogItem,
  CatalogQuery,
  ProductDetail,
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
    const { items, total } = applyCatalogFilters(toCatalogItems(pool), query);
    return { items, total };
  }
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  params.set("page", String(query.page));
  return apiFetch<ProductsListResult>(`/products?${params.toString()}`, signal);
}

/**
 * Detail produk by-slug (mock-only tahap ini).
 * Kontrak BE `GET /products/{slug}` belum ada di `openapi.yaml`
 * ("tidak terverifikasi") — evolusi BE tinggal ganti isi ke `apiFetch`
 * tanpa mengubah signature.
 * Slug tak ada → `ApiError` 404 (dipetakan ke `notFound()` di route).
 */
export async function getProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ProductDetail> {
  const key = slug.trim().toLowerCase();
  if (isMockMode()) {
    const pool = await mockGet<ProductDetail[]>("/products/detail", signal);
    const found = pool.find((p) => p.slug.toLowerCase() === key);
    if (found) return found;
    // Fallback: slug ada di pool katalog tapi belum punya fixture kaya —
    // bangun detail minimal agar deep-link katalog tidak 404 sia-sia.
    const catalogPool = await mockGet<UnifiedProduct[]>("/products", signal);
    const base = catalogPool.find((p) => p.slug.toLowerCase() === key);
    if (base) {
      return {
        ...base,
        stock: base.stock ?? 5,
        reviewCount: base.reviewCount ?? 0,
        gallery: [base.image],
        description: `${base.name} — rangkaian kurasi atelier Delysa Florist, Tasikmalaya.`,
        care: [
          "Potong miring 1-2 cm dan ganti air tiap 1-2 hari.",
          "Jauhkan dari panas langsung agar bertahan 5-7 hari.",
        ],
        specs: [{ label: "Kategori", value: base.category }],
        shipping: ["Same-day Tasikmalaya sebelum 18.00 WIB."],
        sizes: [{ id: "standard", label: "Standard", priceDelta: 0 }],
        wraps: [{ id: "standard", label: "Standard" }],
        ratingBreakdown: [
          { stars: 5, pct: 90 },
          { stars: 4, pct: 8 },
          { stars: 3, pct: 2 },
          { stars: 2, pct: 0 },
          { stars: 1, pct: 0 },
        ],
        reviews: [],
      };
    }
    throw new ApiError(404, `Produk "${slug}" tidak ditemukan`);
  }
  return apiFetch<ProductDetail>(
    `/products/${encodeURIComponent(slug)}`,
    signal,
  );
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
