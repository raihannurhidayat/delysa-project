import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@delysa/shared";
import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  getOrderStatusMeta,
  isClosedOrderStatus,
} from "./order-status";

describe("order status metadata", () => {
  it("provides complete metadata for every status", () => {
    for (const status of ORDER_STATUSES) {
      const meta = ORDER_STATUS_META[status];
      expect(meta.label).toBeTruthy();
      expect(meta.shortLabel).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.tone).toBeTruthy();
    }
  });

  it("keeps the six happy-path stages in order", () => {
    expect(ORDER_FLOW).toEqual([
      "pending_payment",
      "pending_verification",
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);
  });

  it("marks cancelled and rejected as closed", () => {
    expect(isClosedOrderStatus("cancelled")).toBe(true);
    expect(isClosedOrderStatus("rejected")).toBe(true);
    expect(isClosedOrderStatus("delivered")).toBe(false);
  });

  it("maps step indexes", () => {
    expect(getOrderStatusMeta("pending_payment").stepIndex).toBe(0);
    expect(getOrderStatusMeta("delivered").stepIndex).toBe(5);
    expect(getOrderStatusMeta("cancelled").stepIndex).toBeNull();
  });
});
