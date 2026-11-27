import { describe, expect, it } from "vitest";
import type { AdminOrderView } from "./admin-order.types";
import { enrichAdminOrder } from "./admin-order-enrichment";
import {
  ADMIN_TAB_LABELS,
  DEFAULT_ADMIN_ORDER_FILTERS,
  filterAdminOrders,
  summarizeAdminOrders,
} from "./admin-order-filters";

const NOW = new Date("2026-11-02T06:00:00.000Z");

function order(overrides: Partial<AdminOrderView>): AdminOrderView {
  return {
    ...enrichAdminOrder({
      id: 1,
      code: "DLF-20261102-0001",
      status: "pending_verification",
      createdAt: new Date(NOW.getTime() - 18 * 60_000).toISOString(),
      updatedAt: new Date(NOW.getTime() - 18 * 60_000).toISOString(),
      paymentDeadline: NOW.toISOString(),
      recipientName: "Amelia Lestari",
      recipientPhone: "0812-3456-7890",
      shippingAddress: "Jl. HZ Mustofa No. 10, Tasikmalaya",
      items: [
        {
          slug: "monolith-peach",
          name: "Monolith Peach",
          image: "",
          sizeId: "",
          sizeLabel: "",
          wrapId: "",
          price: 370000,
          qty: 2,
        },
      ],
      totals: {
        itemCount: 2,
        subtotalNormal: 740000,
        productDiscount: 0,
        subtotal: 740000,
        shipping: 0,
        packaging: 0,
        couponDiscount: 0,
        grandTotal: 740000,
        freeShipping: false,
        remainingForFree: 0,
      },
      payment: {
        methodId: "manual_transfer_bca",
        label: "Transfer Manual BCA",
        description: "",
        bank: { name: "BCA", accountNumber: "x", accountName: "Kartinah" },
        steps: [],
      },
      timeline: [
        {
          status: "pending_verification",
          at: new Date(NOW.getTime() - 18 * 60_000).toISOString(),
        },
      ],
    }),
    ...overrides,
  };
}

const ORDER_CODE = "DLF-20261102-0001";

function buildFixture(): AdminOrderView[] {
  return [
    order({}),
    order({
      code: "DLF-20261101-0002",
      status: "processing",
      recipientName: "Rian Ardiansyah",
      createdAt: new Date(NOW.getTime() - 2.2 * 3_600_000).toISOString(),
      payment: {
        methodId: "manual_transfer_bca",
        label: "Transfer Manual BCA",
        description: "",
        bank: { name: "BCA", accountNumber: "x", accountName: "Kartinah" },
        steps: [],
      },
    }),
    order({
      code: "DLF-20261020-0003",
      status: "delivered",
      createdAt: new Date("2026-10-20T02:00:00.000Z").toISOString(),
      payment: {
        methodId: "qris",
        label: "QRIS",
        description: "",
        steps: [],
      },
    }),
  ];
}

function makeCodeBatchUnsil(view: AdminOrderView): AdminOrderView {
  const code = `${view.code}X${"A".repeat(Math.max(0, 60 - view.code.length))}`;
  return { ...view, code };
}

describe("ADMIN_TAB_LABELS", () => {
  it("uses the labels from Gambar 1", () => {
    expect(ADMIN_TAB_LABELS.pending_verification).toBe("Menunggu Verifikasi");
    expect(ADMIN_TAB_LABELS.closed).toBe("Dibatalkan & Ditolak");
    expect(ADMIN_TAB_LABELS.all).toBe("Semua");
  });
});

describe("filterAdminOrders", () => {
  it("returns everything for default filters", () => {
    const result = filterAdminOrders(
      buildFixture(),
      DEFAULT_ADMIN_ORDER_FILTERS,
      NOW,
    );
    expect(result).toHaveLength(3);
  });

  it("filters by status tab using ORDER_TABS statuses", () => {
    const result = filterAdminOrders(
      buildFixture(),
      { ...DEFAULT_ADMIN_ORDER_FILTERS, statusTab: "processing" },
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe("DLF-20261101-0002");
  });

  it("filters closed tab over cancelled and rejected", () => {
    const fixture = [...buildFixture(), order({ status: "rejected" })];
    const result = filterAdminOrders(
      fixture,
      { ...DEFAULT_ADMIN_ORDER_FILTERS, statusTab: "closed" },
      NOW,
    );
    expect(
      result.every((candidate) =>
        ["cancelled", "rejected"].includes(candidate.status),
      ),
    ).toBe(true);
  });

  it("filters by case-insensitive search across code, recipient, items", () => {
    const result = filterAdminOrders(
      buildFixture(),
      { ...DEFAULT_ADMIN_ORDER_FILTERS, search: "rian ardi" },
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.recipientName).toBe("Rian Ardiansyah");
  });

  it("filters periode today by Jakarta calendar day", () => {
    const result = filterAdminOrders(
      buildFixture(),
      { ...DEFAULT_ADMIN_ORDER_FILTERS, period: "today" },
      NOW,
    );
    expect(result).toHaveLength(2);
  });

  it("filters periode 7 hari by cutoff", () => {
    const result = filterAdminOrders(
      buildFixture(),
      { ...DEFAULT_ADMIN_ORDER_FILTERS, period: "7d" },
      NOW,
    );
    expect(result).toHaveLength(2);
  });

  it("filters batch unsil deterministically", () => {
    const fixture = buildFixture().map(makeCodeBatchUnsil);
    const result = filterAdminOrders(
      fixture,
      { ...DEFAULT_ADMIN_ORDER_FILTERS, batch: "unsil" },
      NOW,
    );
    expect(result.every((candidate) => candidate.batch === "unsil")).toBe(true);
  });
});

describe("summarizeAdminOrders", () => {
  it("computes queue counts and per-tab counts", () => {
    const summary = summarizeAdminOrders(buildFixture());
    expect(summary.verification).toBe(1);
    expect(summary.assembly).toBe(1);
    expect(summary.delivery).toBe(0);
    expect(summary.counts).toEqual({
      all: 3,
      pending_payment: 0,
      pending_verification: 1,
      paid: 0,
      processing: 1,
      shipped: 0,
      delivered: 1,
      closed: 0,
    });
  });
});

describe("ORDER_CODE integration", () => {
  it("searches by order code prefix", () => {
    const result = filterAdminOrders(
      buildFixture(),
      { ...DEFAULT_ADMIN_ORDER_FILTERS, search: ORDER_CODE.toLowerCase() },
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe(ORDER_CODE);
  });
});
