export type ProductStockStatus = "aman" | "menipis" | "habis";

export type AdminProduct = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  stockUnit: string;
  minThreshold: number;
  sales: number;
  rating: number;
  imageUrl?: string;
  isPublished: boolean;
};

/** Status publik produk: "live" = dipublikasi & tampil di shop, "private" = tidak dipublikasi. */
export type ProductPublicStatus = "live" | "private";

/** Nilai filter status publik; "all" menampilkan semua status. */
export type ProductPublicStatusFilter = ProductPublicStatus | "all";

export const PRODUCT_PUBLIC_STATUS_OPTIONS: {
  value: ProductPublicStatus;
  label: string;
}[] = [
  { value: "live", label: "Live" },
  { value: "private", label: "Private" },
];

export type ProductStockFilter = "all" | ProductStockStatus;

export type ProductFilters = {
  search: string;
  category: string;
  stockStatus: ProductStockFilter;
  publicStatus: ProductPublicStatusFilter;
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "",
  category: "all",
  stockStatus: "all",
  publicStatus: "all",
};

export const PRODUCT_CATEGORIES = [
  "Buket",
  "Standing Flower",
  "Bloom Box",
  "Single Stem",
] as const;

export function getProductRevenue(product: AdminProduct): number {
  return product.price * product.sales;
}

export function getProductPublicStatus(
  product: AdminProduct,
): ProductPublicStatus {
  return product.isPublished ? "live" : "private";
}
