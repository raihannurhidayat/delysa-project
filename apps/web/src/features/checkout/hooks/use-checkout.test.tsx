import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockUseMiniCart,
  mockCreateOrder,
  mockUploadProof,
  mockGetGuestToken,
  mockSetGuestToken,
  mockClearCart,
} = vi.hoisted(() => ({
  mockUseMiniCart: vi.fn(),
  mockCreateOrder: vi.fn(),
  mockUploadProof: vi.fn(),
  mockGetGuestToken: vi.fn(),
  mockSetGuestToken: vi.fn(),
  mockClearCart: vi.fn(),
}));

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

import { useCheckout } from "./use-checkout";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const ORDER = {
  id: 1,
  code: "DLF-20261019-ABCD",
  status: "pending_payment" as const,
  total: 75000,
};

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
          sizeLabel: "Medium",
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
      updateQty: vi.fn(),
      remove: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      clearCart: mockClearCart,
    });

    mockGetGuestToken.mockReturnValue("test-guest-token");
    mockSetGuestToken.mockImplementation(() => {});
  });

  it("uses the step from the URL and starts with an empty form", () => {
    const { result } = renderHook(() => useCheckout({ step: "review" }), {
      wrapper,
    });
    expect(result.current.step).toBe("review");
    expect(result.current.form.getValues("recipientName")).toBe("");
    expect(result.current.form.getValues("recipientPhone")).toBe("");
    expect(result.current.form.getValues("shippingAddress")).toBe("");
  });

  it("persists draft to localStorage on form change", async () => {
    const { result } = renderHook(() => useCheckout({ step: "alamat" }), {
      wrapper,
    });
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
    });
    await waitFor(() => {
      const draft = localStorage.getItem("checkout_draft_test-guest-token");
      expect(draft).not.toBeNull();
      if (draft) {
        expect(JSON.parse(draft).recipientName).toBe("Budi");
      }
    });
  });

  it("restores a saved draft on mount", async () => {
    localStorage.setItem(
      "checkout_draft_test-guest-token",
      JSON.stringify({
        step: "alamat",
        recipientName: "Sari",
        recipientPhone: "08123456789",
        shippingAddress: "Jl. Merdeka No. 10, Tasikmalaya",
        customNote: "",
        confirmed: false,
        guestToken: "test-guest-token",
        updatedAt: Date.now(),
      }),
    );

    const { result } = renderHook(() => useCheckout({ step: "alamat" }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.form.getValues("recipientName")).toBe("Sari");
    });
    expect(result.current.form.getValues("shippingAddress")).toBe(
      "Jl. Merdeka No. 10, Tasikmalaya",
    );
  });

  it("blocks forward navigation when the current step is invalid", async () => {
    const { result } = renderHook(() => useCheckout({ step: "alamat" }), {
      wrapper,
    });

    let allowed = true;
    await act(async () => {
      allowed = await result.current.goToStep("bayar");
    });

    expect(allowed).toBe(false);
  });

  it("allows backward navigation without validating", async () => {
    const { result } = renderHook(() => useCheckout({ step: "ringkasan" }), {
      wrapper,
    });

    let allowed = false;
    await act(async () => {
      allowed = await result.current.goToStep("alamat");
    });

    expect(allowed).toBe(true);
  });

  it("submits order with idempotency key and clears the cart", async () => {
    mockCreateOrder.mockResolvedValue(ORDER);
    const { result } = renderHook(() => useCheckout({ step: "ringkasan" }), {
      wrapper,
    });

    act(() => {
      result.current.form.setValue("recipientName", "Budi");
      result.current.form.setValue("recipientPhone", "08123456789");
      result.current.form.setValue(
        "shippingAddress",
        "Jl. Test No. 1, Tasikmalaya",
      );
      result.current.form.setValue("confirmed", true);
    });

    let submitted: Awaited<
      ReturnType<typeof result.current.submitOrder>
    > | null = null;
    await act(async () => {
      submitted = await result.current.submitOrder();
    });

    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    expect(mockCreateOrder.mock.calls[0][0]).toMatchObject({
      recipientName: "Budi",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Test No. 1, Tasikmalaya",
      idempotencyKey: expect.any(String),
    });
    expect(mockClearCart).toHaveBeenCalledTimes(1);
    expect(submitted).toMatchObject({ order: ORDER, proofError: null });
    expect(localStorage.getItem("checkout_draft_test-guest-token")).toBeNull();
  });

  it("uploads the payment proof after the order is created", async () => {
    mockCreateOrder.mockResolvedValue(ORDER);
    mockUploadProof.mockResolvedValue({
      ...ORDER,
      status: "pending_verification",
    });
    const { result } = renderHook(() => useCheckout({ step: "ringkasan" }), {
      wrapper,
    });

    const file = new File(["x"], "bukti.jpg", { type: "image/jpeg" });
    act(() => {
      result.current.form.setValue("recipientName", "Budi");
      result.current.form.setValue("recipientPhone", "08123456789");
      result.current.form.setValue(
        "shippingAddress",
        "Jl. Test No. 1, Tasikmalaya",
      );
      result.current.form.setValue("paymentProof", {
        file,
        preview: "blob:mock",
      });
      result.current.form.setValue("confirmed", true);
    });

    await act(async () => {
      await result.current.submitOrder();
    });

    expect(mockUploadProof).toHaveBeenCalledWith(ORDER.id, file);
  });

  it("returns a friendly STOCK_INSUFFICIENT error and keeps the cart", async () => {
    mockCreateOrder.mockRejectedValue({
      status: 409,
      message: "STOCK_INSUFFICIENT: stok habis",
    });
    const { result } = renderHook(() => useCheckout({ step: "ringkasan" }), {
      wrapper,
    });

    act(() => {
      result.current.form.setValue("recipientName", "Budi");
      result.current.form.setValue("recipientPhone", "08123456789");
      result.current.form.setValue(
        "shippingAddress",
        "Jl. Test No. 1, Tasikmalaya",
      );
      result.current.form.setValue("confirmed", true);
    });

    await expect(
      act(async () => {
        await result.current.submitOrder();
      }),
    ).rejects.toThrow("Stok tidak mencukupi");

    await waitFor(() => {
      expect(result.current.error).toContain("Stok tidak mencukupi");
    });
    expect(mockClearCart).not.toHaveBeenCalled();
  });
});
