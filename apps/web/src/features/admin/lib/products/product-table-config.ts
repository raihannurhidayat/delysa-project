import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  type ReactTable,
} from "@tanstack/react-table";
import type { AdminProduct } from "./product.types";

/**
 * Fitur tabel produk (TanStack Table v9).
 * Slot row model wajib didaftarkan setelah fitur prasyaratnya.
 */
export const productTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
});

export type ProductTable = ReactTable<
  typeof productTableFeatures,
  AdminProduct
>;

/** Kolom opsional yang boleh disembunyikan lewat "Customize View". */
export const TOGGLEABLE_COLUMN_LABELS: Record<string, string> = {
  category: "Kategori",
  price: "Harga",
  sales: "Terjual",
  revenue: "Pendapatan",
  stock: "Stok",
  status: "Status Stok",
  rating: "Rating",
  minThreshold: "Threshold Minimum",
  isPublished: "Status Publik",
};

export const PRODUCT_PAGE_SIZE = 8;
