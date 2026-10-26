import { describe, expect, it } from "vitest";
import { buildOrderRecord } from "./order-record";
import type { CheckoutFormData, MiniCartLine } from "~/features/shop/types";
import type { CartTotals } from "~/features/shop/lib/cart-totals";

const NOW = new Date("2026-10-24T10:00:00.000Z");

const FORM: CheckoutFormData = {
  step: "ringkasan",
  recipientName: "Sari Amelia",
  recipientPhone: "08123456789",
  shippingAddress: "Jl. Merdeka No. 10, Tasikmalaya",
  customNote: "",
  paymentMethod: "manual_transfer_bca",
  confirmed: true,
};

const LINES: MiniCartLine[] = [
  {
    slug: "mawar-merah",
    name: "Mawar Merah",
    image: "/mawar.jpg",
    sizeId: "medium",
    sizeLabel: "Medium",
    wrapId: "kraft",
    wrapLabel: "Kraft",
    price: 150000,
    qty: 1,
    kind: "product",
  },
];

const TOTALS: CartTotals = {
  itemCount: 1,
  subtotalNormal: 150000,
  productDiscount: 0,
  subtotal: 150000,
  shipping: 25000,
  packaging: 0,
  couponDiscount: 0,
  grandTotal: 175000,
  freeShipping: false,
  remainingForFree: 50000,
};

const ORDER = {
  id: 42,
  code: "DLF-20261024-ABCD",
  status: "pending_payment" as const,
  total: 1,
};

describe("buildOrderRecord", () => {
  it("maps a BCA payment snapshot", () => {
    const record = buildOrderRecord({
      order: ORDER,
      form: FORM,
      lines: LINES,
      totals: TOTALS,
      now: NOW,
    });

    expect(record.payment).toMatchObject({
      methodId: "manual_transfer_bca",
      label: "Transfer Manual BCA",
      bank: {
        name: "BCA",
        accountNumber: "054-082-9912",
        accountName: "Kartinah",
      },
    });
    expect(record.payment.steps).toHaveLength(3);
  });

  it("maps QRIS without a bank", () => {
    const record = buildOrderRecord({
      order: ORDER,
      form: { ...FORM, paymentMethod: "qris" },
      lines: LINES,
      totals: TOTALS,
      now: NOW,
    });

    expect(record.payment.methodId).toBe("qris");
    expect(record.payment.bank).toBeUndefined();
  });

  it("sets the deadline and initial timeline", () => {
    const record = buildOrderRecord({
      order: ORDER,
      form: FORM,
      lines: LINES,
      totals: TOTALS,
      now: NOW,
    });

    expect(record.paymentDeadline).toBe("2026-10-25T10:00:00.000Z");
    expect(record.timeline).toEqual([
      {
        status: "pending_payment",
        at: NOW.toISOString(),
        note: "Pesanan dibuat",
      },
    ]);
  });

  it("copies items and totals from the cart", () => {
    const lines = LINES.map((line) => ({ ...line }));
    const totals = { ...TOTALS };
    const record = buildOrderRecord({
      order: ORDER,
      form: FORM,
      lines,
      totals,
      now: NOW,
    });

    lines[0].name = "Berubah";
    totals.grandTotal = 1;

    expect(record.items[0].name).toBe("Mawar Merah");
    expect(record.totals.grandTotal).toBe(175000);
    expect(record.totals.grandTotal).not.toBe(ORDER.total);
  });

  it("turns an empty note into undefined", () => {
    const record = buildOrderRecord({
      order: ORDER,
      form: FORM,
      lines: LINES,
      totals: TOTALS,
      now: NOW,
    });
    expect(record.customNote).toBeUndefined();
  });
});
