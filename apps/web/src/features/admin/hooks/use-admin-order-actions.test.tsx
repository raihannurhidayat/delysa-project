import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAdminOrderActions } from "./use-admin-order-actions";
import { enrichAdminOrder } from "../lib/pesanan/admin-order-enrichment";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

const updateOrderStatus = vi.hoisted(() => vi.fn());

vi.mock("~/features/shop/lib/order-store", () => ({
  updateOrderStatus,
}));

const NOW = new Date("2026-11-02T06:00:00.000Z");

function order(status: AdminOrderView["status"]): AdminOrderView {
  const createdAt = new Date("2026-11-02T04:00:00.000Z").toISOString();

  return {
    ...enrichAdminOrder(
      {
        id: 1,
        code: "DLF-20261102-0001",
        status,
        createdAt,
        updatedAt: createdAt,
        paymentDeadline: createdAt,
        recipientName: "Amelia Lestari",
        recipientPhone: "0812-3456-7890",
        shippingAddress: "Jl. HZ Mustofa No. 10, Tasikmalaya",
        items: [],
        totals: {
          itemCount: 1,
          subtotalNormal: 370000,
          productDiscount: 0,
          subtotal: 370000,
          shipping: 0,
          packaging: 0,
          couponDiscount: 0,
          grandTotal: 370000,
          freeShipping: false,
          remainingForFree: 0,
        },
        payment: {
          methodId: "manual_transfer_bca",
          label: "Transfer Manual BCA",
          description: "",
          bank: {
            name: "BCA",
            accountNumber: "054-082-9912",
            accountName: "Kartinah",
          },
          steps: [],
        },
        timeline: [{ status, at: createdAt }],
      },
      NOW,
    ),
  } as AdminOrderView;
}

describe("useAdminOrderActions", () => {
  it("applies a legal action by calling updateOrderStatus", () => {
    const encoded = order("pending_verification");
    const { result } = renderHook(() => useAdminOrderActions());

    updateOrderStatus.mockReturnValue({
      ...encoded,
      status: "paid",
    } as AdminOrderView);

    expect(result.current.applyAction(encoded, "verify")).toEqual(
      expect.objectContaining({ status: "paid" }),
    );
    expect(updateOrderStatus).toHaveBeenCalledWith(
      "DLF-20261102-0001",
      "paid",
      { note: "Verifikasi" },
    );
  });

  it("returns null for an illegal action without touching the store", () => {
    const paid = order("paid");
    const { result } = renderHook(() => useAdminOrderActions());
    updateOrderStatus.mockClear();

    expect(result.current.applyAction(paid, "verify")).toBeNull();
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  it("returns the verifikasi reject Target path", () => {
    const encoded = order("pending_verification");
    const { result } = renderHook(() => useAdminOrderActions());
    updateOrderStatus.mockReturnValue(null);

    expect(result.current.applyAction(encoded, "reject")).toBeNull();
    expect(updateOrderStatus).toHaveBeenCalledWith(
      "DLF-20261102-0001",
      "rejected",
      { note: "Tolak" },
    );
  });
});
