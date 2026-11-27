import {
  createAdminProductApi,
  deleteAdminProductApi,
  fetchAdminProductsApi,
  updateAdminProductApi,
} from "~/features/shop/api/endpoints";
import { isMockMode } from "~/features/shop/api/http";
import { MOCK_PRODUCTS } from "./mock-products";
import type { AdminProduct } from "./product.types";

let adminProductsStore: AdminProduct[] = isMockMode() ? [...MOCK_PRODUCTS] : [];
let hydratedFromApi = false;
let syncingProducts = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function broadcastProductsUpdate() {
  if (
    typeof window === "undefined" ||
    typeof BroadcastChannel === "undefined"
  ) {
    return;
  }
  try {
    const channel = new BroadcastChannel("delysa-realtime");
    channel.postMessage({ topic: "products", at: Date.now() });
    channel.close();
  } catch {
    // ignore unsupported contexts
  }
}

export async function refreshAdminProductsFromApi(): Promise<void> {
  if (typeof window === "undefined" || isMockMode() || syncingProducts) return;
  syncingProducts = true;
  try {
    const remote = await fetchAdminProductsApi();
    adminProductsStore = remote;
    hydratedFromApi = true;
    notifyListeners();
  } catch {
    // Abaikan jika belum login sebagai admin/store_owner.
  } finally {
    syncingProducts = false;
  }
}

export function getAdminProducts(): AdminProduct[] {
  if (!hydratedFromApi && typeof window !== "undefined" && !isMockMode()) {
    hydratedFromApi = true;
    void refreshAdminProductsFromApi();
  }
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
  imageFile?: File | null,
): AdminProduct {
  const tempId =
    product.id ?? Math.max(0, ...adminProductsStore.map((item) => item.id)) + 1;
  const created: AdminProduct = {
    ...product,
    id: tempId,
  };
  adminProductsStore = [created, ...adminProductsStore];
  notifyListeners();

  if (!isMockMode()) {
    const { id: _ignored, ...payload } = created;
    void createAdminProductApi(payload, imageFile)
      .then((serverProduct) => {
        adminProductsStore = adminProductsStore.map((item) =>
          item.id === tempId ? serverProduct : item,
        );
        notifyListeners();
        broadcastProductsUpdate();
      })
      .catch(() => {
        void refreshAdminProductsFromApi();
      });
  }

  return created;
}

export function updateAdminProduct(
  id: number,
  updates: Partial<Omit<AdminProduct, "id">>,
  imageFile?: File | null,
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
    if (!isMockMode()) {
      void updateAdminProductApi(id, updates, imageFile)
        .then((serverProduct) => {
          adminProductsStore = adminProductsStore.map((item) =>
            item.id === id ? serverProduct : item,
          );
          notifyListeners();
          broadcastProductsUpdate();
        })
        .catch(() => {
          void refreshAdminProductsFromApi();
        });
    }
  }
  return updatedItem;
}

export function removeAdminProduct(id: number): void {
  adminProductsStore = adminProductsStore.filter((item) => item.id !== id);
  notifyListeners();
  if (!isMockMode()) {
    void deleteAdminProductApi(id)
      .then(() => {
        broadcastProductsUpdate();
      })
      .catch(() => {
        void refreshAdminProductsFromApi();
      });
  }
}

export function resetAdminProducts(): AdminProduct[] {
  adminProductsStore = isMockMode() ? [...MOCK_PRODUCTS] : [];
  notifyListeners();
  return adminProductsStore;
}

export function subscribeAdminProducts(listener: () => void): () => void {
  if (!hydratedFromApi && typeof window !== "undefined" && !isMockMode()) {
    hydratedFromApi = true;
    void refreshAdminProductsFromApi();
  }
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
    Wisuda: "WSD",
    Mawar: "MWR",
    Anggrek: "ANG",
    Kado: "KDO",
    Papan: "PPN",
    Meja: "MJA",
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
    case "Kado":
      return "Box";
    case "Standing Flower":
    case "Papan":
      return "Papan";
    case "Single Stem":
      return "Tangkai";
    case "Anggrek":
      return "Pot";
    case "Meja":
      return "Vas";
    default:
      return "Buket";
  }
}
