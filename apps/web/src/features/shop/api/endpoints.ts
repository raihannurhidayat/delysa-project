import type { OrderCreateInput, OrderStatus } from "@delysa/shared";
import type { AdminProduct } from "~/features/admin/lib/products/product.types";
import {
  ApiError,
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  apiUpload,
  isMockMode,
} from "~/features/shop/api/http";
import {
  applyCatalogFilters,
  countCatalogByCategory,
  mockGet,
} from "~/features/shop/api/mock";
import type {
  CatalogItem,
  CatalogQuery,
  OrderRecord,
  ProductDetail,
  UnifiedProduct,
} from "~/features/shop/types";

export type ProductsListResult = {
  items: UnifiedProduct[];
  total: number;
  counts?: Record<string, number>;
};

function toCatalogItems(items: UnifiedProduct[]): CatalogItem[] {
  return items as CatalogItem[];
}

export function getFlashSaleProducts(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/flash-sale", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/flash-sale", signal);
}

export function getBestSellers(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/best-sellers", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/best-sellers", signal);
}

export function getNewArrivals(
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/new-arrivals", signal);
  }
  return apiFetch<UnifiedProduct[]>("/products/new-arrivals", signal);
}

export function getProductsByCategory(
  category: string,
  signal?: AbortSignal,
): Promise<UnifiedProduct[]> {
  if (isMockMode()) {
    return mockGet<UnifiedProduct[]>("/products/by-category", signal).then(
      (pool) => pool.filter((p) => p.category === category),
    );
  }
  return apiFetch<UnifiedProduct[]>(
    `/products/by-category?category=${encodeURIComponent(category)}`,
    signal,
  );
}

export async function getProducts(
  query: CatalogQuery,
  signal?: AbortSignal,
): Promise<ProductsListResult> {
  if (isMockMode()) {
    const pool = await mockGet<UnifiedProduct[]>("/products", signal);
    const { items, total } = applyCatalogFilters(toCatalogItems(pool), query);
    return { items, total };
  }
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.minPrice !== undefined)
    params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined)
    params.set("maxPrice", String(query.maxPrice));
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(query.page));

  const payload = await apiFetch<{
    data?: UnifiedProduct[];
    items?: UnifiedProduct[];
    total?: number;
    counts?: Record<string, number>;
  }>(`/products?${params.toString()}`, signal);

  const items = payload.items ?? payload.data ?? [];
  return {
    items,
    total: payload.total ?? items.length,
    counts: payload.counts,
  };
}

export async function getProductBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<ProductDetail> {
  const key = slug.trim().toLowerCase();
  if (isMockMode()) {
    const pool = await mockGet<ProductDetail[]>("/products/detail", signal);
    const found = pool.find((p) => p.slug.toLowerCase() === key);
    if (found) return found;
    const catalogPool = await mockGet<UnifiedProduct[]>("/products", signal);
    const base = catalogPool.find((p) => p.slug.toLowerCase() === key);
    if (base) {
      return {
        ...base,
        stock: base.stock ?? 5,
        reviewCount: base.reviewCount ?? 0,
        gallery: [base.image],
        description: `${base.name} dirangkai langsung oleh Delysa Florist, Tasikmalaya.`,
        care: [
          "Potong miring 1-2 cm dan ganti air tiap 1-2 hari.",
          "Jauhkan dari panas langsung agar bertahan 5-7 hari.",
        ],
        specs: [{ label: "Kategori", value: base.category }],
        shipping: ["Same-day Tasikmalaya sebelum 18.00 WIB."],
        sizes: [{ id: "standard", label: "Standard", priceDelta: 0 }],
        wraps: [{ id: "standard", label: "Standard" }],
        ratingBreakdown: [
          { stars: 5, pct: 90 },
          { stars: 4, pct: 8 },
          { stars: 3, pct: 2 },
          { stars: 2, pct: 0 },
          { stars: 1, pct: 0 },
        ],
        reviews: [],
      };
    }
    throw new ApiError(404, `Produk "${slug}" tidak ditemukan`);
  }
  return apiFetch<ProductDetail>(
    `/products/${encodeURIComponent(slug)}`,
    signal,
  );
}

export async function getCategoryCounts(
  query: Omit<CatalogQuery, "category" | "page">,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  if (isMockMode()) {
    const pool = await mockGet<UnifiedProduct[]>("/products", signal);
    return countCatalogByCategory(toCatalogItems(pool), query);
  }
  const result = await getProducts(
    { ...query, category: undefined, page: 1 },
    signal,
  );
  if (result.counts) {
    return result.counts;
  }
  const counts: Record<string, number> = {};
  for (const item of result.items) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  return counts;
}

export type OrderResponse = {
  id: number;
  code: string;
  status: OrderStatus;
  total: number;
} & Partial<OrderRecord>;

export async function createOrder(
  input: OrderCreateInput,
  signal?: AbortSignal,
): Promise<OrderResponse> {
  if (isMockMode()) {
    if (input.idempotencyKey === "stock-insufficient-test") {
      throw new ApiError(
        409,
        "STOCK_INSUFFICIENT: Stok tidak mencukupi untuk item tertentu",
      );
    }
    return {
      id: Date.now(),
      code: `DLF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "pending_payment",
      total: 250000,
    };
  }
  return apiPost<OrderResponse>("/orders", input, signal);
}

export async function uploadPaymentProof(
  orderId: number,
  file: File,
  signal?: AbortSignal,
): Promise<OrderResponse> {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      id: orderId,
      code: `DLF-${orderId}`,
      status: "pending_verification",
      total: 250000,
    };
  }
  const formData = new FormData();
  formData.append("proof", file);
  return apiUpload<OrderResponse>(
    `/orders/${orderId}/payment-proof`,
    formData,
    signal,
  );
}

export async function fetchOrdersApi(
  codes: string[] = [],
  signal?: AbortSignal,
): Promise<OrderRecord[]> {
  if (isMockMode()) return [];
  const params = new URLSearchParams();
  if (codes.length > 0) params.set("codes", codes.join(","));
  const qs = params.toString();
  const res = await apiFetch<{ data: OrderRecord[] }>(
    qs ? `/orders?${qs}` : "/orders",
    signal,
  );
  return res.data ?? [];
}

export async function fetchOrderByCodeApi(
  code: string,
  signal?: AbortSignal,
): Promise<OrderRecord> {
  return apiFetch<OrderRecord>(
    `/orders/${encodeURIComponent(code.trim().toUpperCase())}`,
    signal,
  );
}

export async function updateAdminOrderStatusApi(
  code: string,
  payload: {
    status: OrderStatus;
    note?: string;
    courier?: string;
    trackingNumber?: string;
  },
  signal?: AbortSignal,
): Promise<OrderRecord> {
  const res = await apiPatch<{ data: OrderRecord }>(
    `/admin/orders/${encodeURIComponent(code)}/status`,
    payload,
    signal,
  );
  return res.data;
}

export async function createAdminManualOrderApi(
  payload: {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    customNote?: string;
    paymentMethod?: "bca_transfer" | "qris";
    status?: OrderStatus;
    items: Array<{
      productId?: number | string;
      slug?: string;
      name: string;
      price: number;
      qty: number;
    }>;
  },
  signal?: AbortSignal,
): Promise<OrderRecord> {
  const res = await apiPost<{ data: OrderRecord }>(
    "/admin/orders",
    payload,
    signal,
  );
  return res.data;
}

export async function fetchAdminProductsApi(
  signal?: AbortSignal,
): Promise<AdminProduct[]> {
  if (isMockMode()) return [];
  const res = await apiFetch<{ data: AdminProduct[] }>(
    "/admin/products",
    signal,
  );
  return res.data ?? [];
}

function buildProductFormData(
  payload: Partial<Omit<AdminProduct, "id">>,
  imageFile: File,
): FormData {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.sku !== undefined) formData.append("sku", payload.sku);
  if (payload.slug !== undefined) formData.append("slug", payload.slug);
  if (payload.category !== undefined)
    formData.append("category", payload.category);
  if (payload.price !== undefined)
    formData.append("price", String(payload.price));
  if (payload.stock !== undefined)
    formData.append("stock", String(payload.stock));
  if (payload.stockUnit !== undefined)
    formData.append("stockUnit", payload.stockUnit);
  if (payload.minThreshold !== undefined)
    formData.append("minThreshold", String(payload.minThreshold));
  if (payload.isPublished !== undefined)
    formData.append("isPublished", payload.isPublished ? "1" : "0");
  if (payload.isCustomizable !== undefined)
    formData.append("isCustomizable", payload.isCustomizable ? "1" : "0");
  if (payload.description !== undefined)
    formData.append("description", payload.description);
  if (payload.botanicalTags) {
    payload.botanicalTags.forEach((tag) =>
      formData.append("botanicalTags[]", tag),
    );
  }
  formData.append("image", imageFile);
  return formData;
}

function sanitizeImagePayload<T extends { imageUrl?: string }>(payload: T): T {
  if (payload.imageUrl && payload.imageUrl.startsWith("blob:")) {
    return { ...payload, imageUrl: undefined };
  }
  return payload;
}

export async function createAdminProductApi(
  payload: Omit<AdminProduct, "id">,
  imageFile?: File | null,
  signal?: AbortSignal,
): Promise<AdminProduct> {
  if (imageFile) {
    const res = await apiUpload<{ data: AdminProduct }>(
      "/admin/products",
      buildProductFormData(payload, imageFile),
      signal,
    );
    return res.data;
  }
  const res = await apiPost<{ data: AdminProduct }>(
    "/admin/products",
    sanitizeImagePayload(payload),
    signal,
  );
  return res.data;
}

export async function updateAdminProductApi(
  id: number,
  updates: Partial<Omit<AdminProduct, "id">>,
  imageFile?: File | null,
  signal?: AbortSignal,
): Promise<AdminProduct> {
  if (imageFile) {
    const res = await apiUpload<{ data: AdminProduct }>(
      `/admin/products/${id}`,
      buildProductFormData(updates, imageFile),
      signal,
    );
    return res.data;
  }
  const res = await apiPatch<{ data: AdminProduct }>(
    `/admin/products/${id}`,
    sanitizeImagePayload(updates),
    signal,
  );
  return res.data;
}

export async function deleteAdminProductApi(
  id: number,
  signal?: AbortSignal,
): Promise<void> {
  await apiDelete(`/admin/products/${id}`, signal);
}

export type AdminSalesReport = {
  period: "7d" | "30d" | "all";
  summary: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalItemsSold: number;
  };
  byCategory: Array<{
    category: string;
    qty: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    slug: string;
    category: string;
    qty: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    code: string;
    recipientName: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
  }>;
};

export async function fetchAdminReportApi(
  period: "7d" | "30d" | "all" = "30d",
  signal?: AbortSignal,
): Promise<AdminSalesReport> {
  return apiFetch<AdminSalesReport>(
    `/admin/reports?period=${encodeURIComponent(period)}`,
    signal,
  );
}
