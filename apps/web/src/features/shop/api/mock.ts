import bestSellers from "~/mock/products/best-sellers.json";
import byCategory from "~/mock/products/by-category.json";
import catalog from "~/mock/products/catalog.json";
import flashSale from "~/mock/products/flash-sale.json";
import newArrivals from "~/mock/products/new-arrivals.json";
import productDetail from "~/mock/products/product-detail.json";
import {
  CATALOG_PAGE_SIZE,
  type CatalogItem,
  type CatalogQuery,
  type CatalogResult,
} from "~/features/shop/types";
import { ApiError } from "~/features/shop/api/http";

/** Latensi tiruan operasi baca agar skeleton/error state terlatih. */
export const MOCK_LATENCY_MS = 500;

/**
 * Registry endpoint → fixture. Tiap endpoint punya file sendiri yang
 * self-contained (duplikasi antar file disengaja, mirip respons API
 * independen) — lihat `docs/superpowers/plans/2026-10-13-mock-api-tanstack-query.md`.
 */
const MOCK_REGISTRY: Record<string, unknown> = {
  "/products/flash-sale": flashSale,
  "/products/best-sellers": bestSellers,
  "/products/new-arrivals": newArrivals,
  "/products/by-category": byCategory,
  "/products": catalog,
  "/products/detail": productDetail,
};

function matchesSearch(item: CatalogItem, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return item.name.toLowerCase().includes(needle);
}

/**
 * Filter katalog murni: OR dalam satu faset, AND antar faset.
 * Stok 0 selalu disembunyikan SEBELUM paginasi (aturan PRD).
 * Dipindah verbatim dari `hooks/use-catalog-data.ts`.
 */
export function applyCatalogFilters(
  source: CatalogItem[],
  q: CatalogQuery,
): CatalogResult {
  const available = source.filter((item) => item.stock > 0);
  const searched = q.search
    ? available.filter((item) => matchesSearch(item, q.search as string))
    : available;
  const byCategory = q.category
    ? searched.filter((item) => item.category === q.category)
    : searched;
  const byMin =
    q.minPrice !== undefined
      ? byCategory.filter((item) => item.price >= (q.minPrice as number))
      : byCategory;
  const byMax =
    q.maxPrice !== undefined
      ? byMin.filter((item) => item.price <= (q.maxPrice as number))
      : byMin;

  const sorted = [...byMax];
  if (q.sort === "termurah") sorted.sort((a, b) => a.price - b.price);
  else if (q.sort === "termahal") sorted.sort((a, b) => b.price - a.price);
  else if (q.sort === "terbaru") sorted.reverse();

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(q.page, 1), pageCount);
  const items = sorted.slice(
    (page - 1) * CATALOG_PAGE_SIZE,
    page * CATALOG_PAGE_SIZE,
  );
  return { items, total, pageCount };
}

/**
 * Hitung jumlah item per kategori dari dataset yang sudah difilter
 * search/harga/sort (kategori diabaikan), stok 0 excluded.
 * Dipindah verbatim dari `hooks/use-catalog-data.ts`.
 */
export function countCatalogByCategory(
  source: CatalogItem[],
  q: Omit<CatalogQuery, "category" | "page">,
): Record<string, number> {
  // Hitung dari SEMUA item yang lolos filter (tanpa paginasi).
  const full = source
    .filter((item) => item.stock > 0)
    .filter((item) => (q.search ? matchesSearch(item, q.search) : true))
    .filter((item) =>
      q.minPrice !== undefined ? item.price >= q.minPrice : true,
    )
    .filter((item) =>
      q.maxPrice !== undefined ? item.price <= q.maxPrice : true,
    );
  const result: Record<string, number> = {};
  for (const item of full) {
    result[item.category] = (result[item.category] ?? 0) + 1;
  }
  return result;
}

export function mockDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Ambil fixture terdaftar setelah latensi tiruan. Menghormati `signal`
 * agar perilaku konsisten dengan transport fetch. Melempar `ApiError`
 * 404 untuk path tak terdaftar (bentuk error sama seperti fetch).
 */
export async function mockGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  await mockDelay(MOCK_LATENCY_MS, signal);
  if (!(path in MOCK_REGISTRY)) {
    throw new ApiError(404, `Mock belum terdaftar untuk ${path}`);
  }
  return structuredClone(MOCK_REGISTRY[path]) as T;
}
