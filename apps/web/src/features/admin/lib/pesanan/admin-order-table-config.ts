import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  type ReactTable,
} from "@tanstack/react-table";
import type { AdminOrderView } from "./admin-order.types";

/**
 * Fitur tabel pesanan admin (TanStack Table v9).
 * Disalin dari pola `product-table-config.ts` tanpa fitur seleksi/visibility.
 * Slot row model wajib didaftarkan setelah fitur prasyaratnya.
 */
export const adminOrderTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
  },
});

export type AdminOrderTable = ReactTable<
  typeof adminOrderTableFeatures,
  AdminOrderView
>;

export const ADMIN_ORDER_PAGE_SIZE = 8;
