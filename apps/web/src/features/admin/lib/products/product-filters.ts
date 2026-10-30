import {
  getProductRevenue,
  type AdminProduct,
  type ProductFilters,
  type ProductStockStatus,
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
      const haystack =
        `${product.name} ${product.sku} ${product.category}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Ringkasan angka untuk kartu statistik dan tab stok. */
export function summarizeProducts(products: AdminProduct[]) {
  const published = products.filter((product) => product.isPublished).length;
  const lowStock = products.filter(
    (product) => getStockStatus(product) === "menipis",
  ).length;
  const outOfStock = products.filter(
    (product) => getStockStatus(product) === "habis",
  ).length;
  const totalSales = products.reduce(
    (total, product) => total + product.sales,
    0,
  );
  const revenue = products.reduce(
    (total, product) => total + getProductRevenue(product),
    0,
  );

  return {
    total: products.length,
    published,
    lowStock,
    outOfStock,
    inStock: products.length - outOfStock,
    totalSales,
    revenue,
  };
}
