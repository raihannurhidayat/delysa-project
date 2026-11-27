import { describe, expect, it } from "vitest";
import type { OrderRecord } from "~/features/shop/types";
import { enrichAdminOrders, hashOrderCode } from "./admin-order-enrichment";

const CREATED_AT = new Date("2026-11-02T04:00:00.000Z").toISOString();
const NOW = new Date("2026-11-02T06:00:00.000Z");

function order(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    id: 1,
    code: "DLF-20261102-0001",
    status: "pending_verification",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    paymentDeadline: CREATED_AT,
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
        qty: 1,
      },
    ],
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
    timeline: [{ status: "pending_verification", at: CREATED_AT }],
    ...overrides,
  };
}

describe("hashOrderCode", () => {
  it("is deterministic and materializes from the code text", () => {
    expect(hashOrderCode("DLF-20261102-0001")).toBe(
      hashOrderCode("DLF-20261102-0001"),
    );
    expect(hashOrderCode("DLF-20261102-0001")).not.toBe(
      hashOrderCode("DLF-20261102-0002"),
    );
  });
});

describe("enrichAdminOrders", () => {
  it("does not mutate the input records", () => {
    const source = order({});
    enrichAdminOrders([source], NOW);

    expect(source.status).toBe("pending_verification");
  });

  it("computes slaBreached only after 90 minutes in pending_verification", () => {
    const breached = enrichAdminOrders(
      [order({})],
      new Date("2026-11-02T05:40:00.000Z"),
    );
    expect(breached[0]?.slaBreached).toBe(true);

    const fresh = enrichAdminOrders(
      [
        order({
          createdAt: new Date("2026-11-02T05:40:00.000Z").toISOString(),
        }),
      ],
      new Date("2026-11-02T05:50:00.000Z"),
    );
    expect(fresh[0]?.slaBreached).toBe(false);
  });

  it("keeps slaBreached false for other statuses", () => {
    const paid = enrichAdminOrders(
      [order({ status: "paid" })],
      new Date("2026-11-02T05:40:00.000Z"),
    );
    expect(paid[0]?.slaBreached).toBe(false);
  });

  it("marks unsil batch and priority deterministically", () => {
    const [view] = enrichAdminOrders([order({})], NOW);

    expect(view).toBeDefined();
    if (!view) return;
    expect(view.batch).toBe(
      hashOrderCode(view.code) % 3 === 0 ? "unsil" : undefined,
    );
    expect(view.priority).toBe(view.batch === "unsil" ? "prioritas" : "normal");
  });

  it("adds workbench only while processing, stable across calls", () => {
    const processing = enrichAdminOrders(
      [order({ status: "processing" })],
      NOW,
    );
    const processingAgain = enrichAdminOrders(
      [order({ status: "processing" })],
      NOW,
    );
    expect(processing[0]?.workbench).toMatch(/^Meja Florist [1-3]$/);
    expect(processing[0]?.workbench).toBe(processingAgain[0]?.workbench);

    const paid = enrichAdminOrders([order({ status: "paid" })], NOW);
    expect(paid[0]?.workbench).toBeUndefined();
  });

  it("adds courier label only while shipped", () => {
    const shipped = enrichAdminOrders(
      [order({ status: "shipped", courier: undefined })],
      NOW,
    );
    expect(shipped[0]?.courierLabel).toBe("Kurir Atelier: Dedi S.");

    const paid = enrichAdminOrders([order({ status: "paid" })], NOW);
    expect(paid[0]?.courierLabel).toBeUndefined();
  });

  it("maps payment kind from the payment snapshot", () => {
    const manual = enrichAdminOrders([order({})], NOW);
    expect(manual[0]?.paymentKind).toBe("manual");

    const instant = enrichAdminOrders(
      [
        order({
          payment: {
            methodId: "qris",
            label: "QRIS",
            description: "",
            steps: [],
          },
        }),
      ],
      NOW,
    );
    expect(instant[0]?.paymentKind).toBe("instant");
  });
});
