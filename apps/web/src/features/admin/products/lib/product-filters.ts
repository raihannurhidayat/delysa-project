import type {
  AdminProduct,
  ProductFilters,
  ProductStockStatus,
} from "./product.types";

/** Habis: stok 0. Menipis: stok <= threshold minimum (dan > 0). */
export function getStockStatus(product: AdminProduct): ProductStockStatus {
  if (product.stock === 0) return "habis";
  if (product.stock <= product.minThreshold) return "menipis";
  return "aman";
}

export function filterProducts(
  products: AdminProduct[],
  filters: ProductFilters,
): AdminProduct[] {
  const search = filters.search.trim().toLowerCase();

  return products.filter((product) => {
    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }
    if (
      filters.stockStatus !== "all" &&
      getStockStatus(product) !== filters.stockStatus
    ) {
      return false;
    }
    if (search) {
      const haystack = `${product.name} ${product.sku} ${product.category}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function paginate(
  items: AdminProduct[],
  page: number,
  perPage: number,
): { rows: AdminProduct[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    rows: items.slice(start, start + perPage),
    total,
    totalPages,
  };
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
