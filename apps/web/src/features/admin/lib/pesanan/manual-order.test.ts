import { describe, expect, it } from "vitest";
import { isOrderRecord } from "~/features/shop/lib/order-storage";
import {
  MANUAL_ORDER_FORM_SCHEMA,
  createManualOrderRecord,
  generateManualOrderCode,
} from "./manual-order";

const NOW = new Date("2026-11-02T06:00:00.000Z");

const VALID_VALUES = {
  itemName: "Monolith Peach",
  itemQty: 2,
  itemPrice: 370000,
  recipientName: "Amelia Lestari",
  recipientPhone: "0812-3456-7890",
  shippingAddress: "Jl. HZ Mustofa No. 10, Tasikmalaya",
  customNote: "",
} as const;

describe("generateManualOrderCode", () => {
  it("matches the DLF-YYYYMMDD-XXXX format", () => {
    const code = generateManualOrderCode(NOW);
    expect(code).toMatch(/^DLF-\d{8}-[A-Z0-9]{4}$/);
    expect(code).toContain("DLF-20261102-");
  });

  it("uniqueness for 50 generated codes", () => {
    const codes = new Set(
      Array.from({ length: 50 }, () => generateManualOrderCode(NOW)),
    );
    expect(codes.size).toBe(50);
  });
});

describe("MANUAL_ORDER_FORM_SCHEMA", () => {
  it("accepts valid values", () => {
    const result = MANUAL_ORDER_FORM_SCHEMA.safeParse(VALID_VALUES);
    expect(result.success).toBe(true);
  });

  it("rejects out of range fields", () => {
    expect(
      MANUAL_ORDER_FORM_SCHEMA.safeParse({ ...VALID_VALUES, itemQty: 0 })
        .success,
    ).toBe(false);
    expect(
      MANUAL_ORDER_FORM_SCHEMA.safeParse({ ...VALID_VALUES, itemQty: 100 })
        .success,
    ).toBe(false);
    expect(
      MANUAL_ORDER_FORM_SCHEMA.safeParse({
        ...VALID_VALUES,
        recipientPhone: "081",
      }).success,
    ).toBe(false);
    expect(
      MANUAL_ORDER_FORM_SCHEMA.safeParse({
        ...VALID_VALUES,
        shippingAddress: "Jl. 1",
      }).success,
    ).toBe(false);
  });
});

describe("createManualOrderRecord", () => {
  it("builds a valid pending-payment order record", () => {
    const record = createManualOrderRecord(
      VALID_VALUES,
      "DLF-20261102-TEST",
      NOW,
    );

    expect(isOrderRecord(record)).toBe(true);
    expect(record.status).toBe("pending_payment");
    expect(record.totals.grandTotal).toBeGreaterThan(0);
    expect(record.items[0]?.name).toBe("Monolith Peach");
    expect(record.payment.methodId).toBe("manual_transfer_bca");
    expect(record.timeline[0]?.note).toBe("Pesanan dibuat oleh admin");
    expect(record.timeline[0]?.status).toBe("pending_payment");
  });
});
