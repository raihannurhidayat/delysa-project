import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOrder, uploadPaymentProof } from "./endpoints";
import { isMockMode, ApiError } from "~/features/shop/api/http";

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mock order in mock mode", async () => {
    expect(isMockMode()).toBe(true);
    const input = {
      recipientName: "Test",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1",
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    };
    const result = await createOrder(input);
    expect(result).toMatchObject({
      id: expect.any(Number),
      code: expect.stringMatching(/^DLF-\d{8}-[A-Z0-9]{4}$/),
      status: "pending_payment",
      total: expect.any(Number),
    });
  });

  it("throws ApiError 409 for STOCK_INSUFFICIENT in mock", async () => {
    const input = {
      recipientName: "Test",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1",
      idempotencyKey: "stock-insufficient-test",
    };
    await expect(createOrder(input)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("STOCK_INSUFFICIENT"),
    });
  });
});

describe("uploadPaymentProof", () => {
  it("returns updated order in mock mode", async () => {
    const file = new File(["dummy"], "bukti.jpg", { type: "image/jpeg" });
    const result = await uploadPaymentProof(1, file);
    expect(result).toMatchObject({
      id: 1,
      status: "pending_verification",
    });
  });
});
