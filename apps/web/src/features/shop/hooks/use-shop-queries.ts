import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  getBestSellers,
  getCategoryCounts,
  getFlashSaleProducts,
  getNewArrivals,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
} from "~/features/shop/api/endpoints";
import { productQueries } from "~/features/shop/api/query-keys";
import type { CatalogQuery } from "~/features/shop/types";

/**
 * Query hooks produk. Satu hook per endpoint; pemanggil memakai
 * `isPending`/`isError`/`data` seperti pola section yang sudah ada.
 * Ganti mock→BE cukup via `VITE_API_URL` tanpa menyentuh file ini.
 */
export function useFlashSaleProducts() {
  return useQuery({
    queryKey: productQueries.flashSale(),
    queryFn: ({ signal }) => getFlashSaleProducts(signal),
    retry: 1,
  });
}

export function useBestSellersProducts() {
  return useQuery({
    queryKey: productQueries.bestSellers(),
    queryFn: ({ signal }) => getBestSellers(signal),
    retry: 1,
  });
}

export function useNewArrivalsProducts() {
  return useQuery({
    queryKey: productQueries.newArrivals(),
    queryFn: ({ signal }) => getNewArrivals(signal),
    retry: 1,
  });
}

export function useCategoryProducts(category: string) {
  return useQuery({
    queryKey: productQueries.byCategory(category),
    queryFn: ({ signal }) => getProductsByCategory(category, signal),
    retry: 1,
  });
}

/**
 * Konfigurasi query detail by-slug, dipakai bersama loader route
 * (`ensureQueryData`) dan komponen (`useSuspenseQuery`/`useQuery`)
 * agar key + fn + staleTime selalu selaras.
 * Diverifikasi via context7: `/tanstack/query` — `queryOptions`.
 */
export function productDetailQuery(slug: string) {
  return queryOptions({
    queryKey: productQueries.detail(slug),
    queryFn: ({ signal }) => getProductBySlug(slug, signal),
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

export function useProductDetail(slug: string) {
  return useQuery(productDetailQuery(slug));
}

export function useSuspenseProductDetail(slug: string) {
  return useSuspenseQuery(productDetailQuery(slug));
}

export function useProducts(query: CatalogQuery) {
  const list = useQuery({
    queryKey: productQueries.filtered(query),
    queryFn: ({ signal }) => getProducts(query, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
  const counts = useQuery({
    queryKey: productQueries.counts(query),
    queryFn: ({ signal }) => getCategoryCounts(query, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  return {
    items: list.data?.items ?? [],
    total: list.data?.total ?? 0,
    counts: counts.data ?? {},
    isPending: list.isPending || counts.isPending,
    isError: list.isError || counts.isError,
  };
}
