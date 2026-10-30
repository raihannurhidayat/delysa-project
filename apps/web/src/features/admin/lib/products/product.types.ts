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

export type ProductStockFilter = "all" | ProductStockStatus;

export type ProductFilters = {
  search: string;
  category: string;
  stockStatus: ProductStockFilter;
};

export const PRODUCT_CATEGORIES = [
  "Buket",
  "Standing Flower",
  "Bloom Box",
  "Single Stem",
] as const;

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "",
  category: "all",
  stockStatus: "all",
};

export function getProductRevenue(product: AdminProduct): number {
  return product.price * product.sales;
}
