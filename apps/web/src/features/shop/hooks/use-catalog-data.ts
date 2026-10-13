import { CATALOG_PRODUCTS } from "~/features/shop/data/catalog";
import {
  CATALOG_PAGE_SIZE,
  type CatalogItem,
  type CatalogQuery,
  type CatalogResult,
} from "~/features/shop/types";

function matchesSearch(item: CatalogItem, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return item.name.toLowerCase().includes(needle);
}

/**
 * Filter katalog murni: OR dalam satu faset, AND antar faset.
 * Stok 0 selalu disembunyikan SEBELUM paginasi (aturan PRD).
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

/**
 * Seam data katalog. Kini: adapter dummy sinkron (SSR penuh).
 * Nanti: ganti isi dengan `useQuery` ke BE tanpa mengubah pemanggil.
 */
export function useCatalogData(q: CatalogQuery): CatalogResult & {
  counts: Record<string, number>;
  isPending: boolean;
  isError: boolean;
} {
  const { items, total, pageCount } = applyCatalogFilters(CATALOG_PRODUCTS, q);
  const counts = countCatalogByCategory(CATALOG_PRODUCTS, q);
  return { items, total, pageCount, counts, isPending: false, isError: false };
}
