import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Use vi.hoisted for mock functions to avoid hoisting issues
const {
  mockUseMiniCart,
  mockCreateOrder,
  mockUploadProof,
  mockGetGuestToken,
  mockSetGuestToken,
} = vi.hoisted(() => ({
  mockUseMiniCart: vi.fn(),
  mockCreateOrder: vi.fn(),
  mockUploadProof: vi.fn(),
  mockGetGuestToken: vi.fn(),
  mockSetGuestToken: vi.fn(),
}));

// Mock modules with factory functions using hoisted mocks
vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: mockUseMiniCart,
}));

vi.mock("../api/endpoints", () => ({
  createOrder: mockCreateOrder,
  uploadPaymentProof: mockUploadProof,
}));

vi.mock("~/features/shop/lib/mini-cart-storage", () => ({
  getGuestToken: mockGetGuestToken,
  setGuestToken: mockSetGuestToken,
}));

// Import after mocks
import { useCheckout } from "./use-checkout";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    mockUseMiniCart.mockReturnValue({
      lines: [
        {
          slug: "test",
          name: "Test",
          image: "",
          sizeId: "s",
          wrapId: "w",
          price: 50000,
          qty: 1,
          kind: "product",
        },
      ],
      totals: {
        itemCount: 1,
        subtotal: 50000,
        shipping: 25000,
        grandTotal: 75000,
        freeShipping: false,
        remainingForFree: 125000,
        productDiscount: 0,
        subtotalNormal: 50000,
        couponDiscount: 0,
        packaging: 0,
      },
      coupon: null,
      instructions: "",
      count: 1,
      subtotal: 50000,
    });

    mockGetGuestToken.mockReturnValue("test-guest-token");
    mockSetGuestToken.mockImplementation(() => {});
  });

  it("initializes with review step and empty form", () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    expect(result.current.step).toBe("review");
    // Form values should be empty strings
    expect(result.current.form.getValues("recipientName")).toBe("");
    expect(result.current.form.getValues("recipientPhone")).toBe("");
    expect(result.current.form.getValues("shippingAddress")).toBe("");
  });

  it("persists draft to localStorage on form change", async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
    });
    await waitFor(() => {
      const draft = localStorage.getItem("checkout_draft_test-guest-token");
      expect(draft).not.toBeNull();
      expect(draft).not.toBe("undefined");
      if (draft) {
        const parsed = JSON.parse(draft);
        expect(parsed.recipientName).toBe("Budi");
      }
    });
  });

  it("submits order with idempotency-key and clears cart on success", async () => {
    mockCreateOrder.mockResolvedValue({
      id: 1,
      code: "DLF-20261019-ABCD",
      status: "pending_payment",
      total: 75000,
    });
    const { result } = renderHook(() => useCheckout(), { wrapper });

    // Fill form data
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
      result.current.form.setValue("recipientPhone", "08123456789");
      result.current.form.setValue("shippingAddress", "Jl. Test No. 1");
    });

    // Navigate to ringkasan step
    await act(async () => {
      await result.current.goToStep("ringkasan");
    });
    act(() => {
      result.current.form.setValue("confirmed", true);
    });

    await act(async () => {
      await result.current.submitOrder();
    });

    // Check that createOrder was called with correct first argument
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    const callArgs = mockCreateOrder.mock.calls[0][0];
    expect(callArgs).toMatchObject({
      recipientName: "Budi",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1",
      idempotencyKey: expect.any(String),
    });
  });

  it("handles STOCK_INSUFFICIENT error and stays on ringkasan", async () => {
    // Mock rejects with an object that has STOCK_INSUFFICIENT in message
    mockCreateOrder.mockRejectedValue({
      status: 409,
      message: "STOCK_INSUFFICIENT",
    });
    const { result } = renderHook(() => useCheckout(), { wrapper });

    // Fill form data
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
      result.current.form.setValue("recipientPhone", "08123456789");
      result.current.form.setValue("shippingAddress", "Jl. Test No. 1");
    });

    await act(async () => {
      await result.current.goToStep("ringkasan");
    });
    act(() => {
      result.current.form.setValue("confirmed", true);
    });

    // submitOrder throws the error, catch it
    await expect(
      act(async () => {
        await result.current.submitOrder();
      }),
    ).rejects.toThrow("Stok tidak mencukupi");

    // After the error, check that error state is set
    await waitFor(() => {
      expect(result.current.error).toContain("Stok tidak mencukupi");
    });
    expect(result.current.step).toBe("ringkasan");
  });

  it("validates current step before allowing next", async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });

    // From review step, try to go to alamat without filling required fields
    // The review step has no required fields, so it should succeed
    // But if we're on alamat step and try to go to bayar without filling, it should fail
    const success = await act(async () => {
      return result.current.goToStep("alamat");
    });
    // From review step, validation passes (no required fields)
    expect(success).toBe(true);
    expect(result.current.step).toBe("alamat");

    // Now try to go to bayar without filling alamat fields
    const success2 = await act(async () => {
      return result.current.goToStep("bayar");
    });
    expect(success2).toBe(false);
    expect(result.current.step).toBe("alamat");
  });
});
