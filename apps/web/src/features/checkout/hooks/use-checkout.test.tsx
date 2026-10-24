import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockUseMiniCart,
  mockCreateOrder,
  mockGetGuestToken,
  mockSetGuestToken,
  mockClearCart,
  mockSaveOrder,
} = vi.hoisted(() => ({
  mockUseMiniCart: vi.fn(),
  mockCreateOrder: vi.fn(),
  mockGetGuestToken: vi.fn(),
  mockSetGuestToken: vi.fn(),
  mockClearCart: vi.fn(),
  mockSaveOrder: vi.fn(),
}));

vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: mockUseMiniCart,
}));

vi.mock("../api/endpoints", () => ({
  createOrder: mockCreateOrder,
}));

vi.mock("~/features/shop/lib/mini-cart-storage", () => ({
  getGuestToken: mockGetGuestToken,
  setGuestToken: mockSetGuestToken,
}));

vi.mock("~/features/shop/lib/order-store", () => ({
  saveOrder: mockSaveOrder,
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
    mockSaveOrder.mockImplementation(() => {});
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
      result.current.form.setValue("paymentMethod", "qris");
    });
    await waitFor(() => {
      const draft = localStorage.getItem("checkout_draft_test-guest-token");
      expect(draft).not.toBeNull();
      if (draft) {
        expect(JSON.parse(draft).recipientName).toBe("Budi");
        expect(JSON.parse(draft).paymentMethod).toBe("qris");
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
        paymentMethod: "manual_transfer_bca",
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
    expect(result.current.form.getValues("paymentMethod")).toBe(
      "manual_transfer_bca",
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

  it("requires a payment method before leaving the bayar step", async () => {
    const { result } = renderHook(() => useCheckout({ step: "bayar" }), {
      wrapper,
    });

    let allowed = true;
    await act(async () => {
      allowed = await result.current.goToStep("ringkasan");
    });
    expect(allowed).toBe(false);

    act(() => {
      result.current.form.setValue("paymentMethod", "qris");
    });

    await act(async () => {
      allowed = await result.current.goToStep("ringkasan");
    });
    expect(allowed).toBe(true);
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
      result.current.form.setValue("paymentMethod", "manual_transfer_bca");
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
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
    expect(mockSaveOrder.mock.calls[0][0]).toMatchObject({
      code: ORDER.code,
      status: ORDER.status,
      payment: { label: "Transfer Manual BCA" },
      items: [{ slug: "test" }],
      totals: { grandTotal: 75000 },
    });
    expect(submitted).toMatchObject({
      order: ORDER,
      paymentMethod: "manual_transfer_bca",
    });
    expect(localStorage.getItem("checkout_draft_test-guest-token")).toBeNull();
  });

  it("keeps checkout successful when saving the demo order fails", async () => {
    mockCreateOrder.mockResolvedValue(ORDER);
    mockSaveOrder.mockImplementation(() => {
      throw new Error("localStorage penuh");
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
      result.current.form.setValue("paymentMethod", "manual_transfer_bca");
      result.current.form.setValue("confirmed", true);
    });

    await expect(
      act(async () => {
        await result.current.submitOrder();
      }),
    ).resolves.toBeUndefined();
    expect(mockClearCart).toHaveBeenCalledTimes(1);
    expect(mockSaveOrder).toHaveBeenCalledTimes(1);
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
