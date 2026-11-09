import { MOCK_PRODUCTS } from "./mock-products";
import type { AdminProduct } from "./product.types";

let adminProductsStore: AdminProduct[] = [...MOCK_PRODUCTS];
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getAdminProducts(): AdminProduct[] {
  return adminProductsStore;
}

export function getAdminProductById(
  idOrSku: number | string,
): AdminProduct | undefined {
  const numericId =
    typeof idOrSku === "number" ? idOrSku : Number.parseInt(idOrSku, 10);
  return adminProductsStore.find(
    (item) =>
      item.id === numericId ||
      item.sku.toLowerCase() === String(idOrSku).toLowerCase() ||
      item.slug?.toLowerCase() === String(idOrSku).toLowerCase(),
  );
}

export function setAdminProducts(
  updater: AdminProduct[] | ((current: AdminProduct[]) => AdminProduct[]),
): AdminProduct[] {
  adminProductsStore =
    typeof updater === "function" ? updater(adminProductsStore) : updater;
  notifyListeners();
  return adminProductsStore;
}

export function addAdminProduct(
  product: Omit<AdminProduct, "id"> & { id?: number },
): AdminProduct {
  const nextId =
    product.id ?? Math.max(0, ...adminProductsStore.map((item) => item.id)) + 1;
  const created: AdminProduct = {
    ...product,
    id: nextId,
  };
  adminProductsStore = [created, ...adminProductsStore];
  notifyListeners();
  return created;
}

export function updateAdminProduct(
  id: number,
  updates: Partial<Omit<AdminProduct, "id">>,
): AdminProduct | undefined {
  let updatedItem: AdminProduct | undefined;
  adminProductsStore = adminProductsStore.map((item) => {
    if (item.id !== id) return item;
    updatedItem = {
      ...item,
      ...updates,
      id: item.id,
    };
    return updatedItem;
  });
  if (updatedItem) {
    notifyListeners();
  }
  return updatedItem;
}

export function resetAdminProducts(): AdminProduct[] {
  adminProductsStore = [...MOCK_PRODUCTS];
  notifyListeners();
  return adminProductsStore;
}

export function subscribeAdminProducts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function slugifyProductName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateProductSku(name: string, category: string): string {
  const categoryPrefix: Record<string, string> = {
    Buket: "BKT",
    "Standing Flower": "STD",
    "Bloom Box": "BOX",
    "Single Stem": "STM",
  };
  const prefix = categoryPrefix[category] ?? "PRD";
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const code =
    words
      .slice(0, 2)
      .map((w) => w.slice(0, 3))
      .join("-") || "NEW";
  return `DF-${prefix}-${code}`;
}

export function getDefaultStockUnit(category: string): string {
  switch (category) {
    case "Bloom Box":
      return "Box";
    case "Standing Flower":
      return "Stand";
    case "Single Stem":
      return "Tangkai";
    default:
      return "Buket";
  }
}
