import { apiPost, apiUpload, ApiError } from "./http";
import { isMockMode } from "~/features/shop/api/http";
import type { OrderCreateInput } from "@delysa/shared";

export type OrderResponse = {
  id: number;
  code: string;
  status:
    | "pending_payment"
    | "pending_verification"
    | "paid"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "rejected";
  total: number;
};

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
