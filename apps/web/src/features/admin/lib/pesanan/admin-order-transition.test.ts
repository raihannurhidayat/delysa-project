import { describe, expect, it } from "vitest";
import { findAction, getAdminOrderActions } from "./admin-order-transition";

describe("getAdminOrderActions", () => {
  it("offers verify + reject for pending verification", () => {
    const actions = getAdminOrderActions("pending_verification");
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({ id: "verify", target: "paid" });
    expect(actions[1]).toMatchObject({
      id: "reject",
      target: "rejected",
      variant: "destructive",
    });
  });

  it("offers one next-step action for in-flight statuses", () => {
    expect(getAdminOrderActions("paid")).toEqual([
      {
        id: "start-assembly",
        label: "Mulai Rakit",
        target: "processing",
        variant: "default",
      },
    ]);
    expect(getAdminOrderActions("processing")).toEqual([
      {
        id: "mark-shipped",
        label: "Tandai Dikirim",
        target: "shipped",
        variant: "default",
      },
    ]);
    expect(getAdminOrderActions("shipped")).toEqual([
      {
        id: "mark-delivered",
        label: "Tandai Selesai",
        target: "delivered",
        variant: "default",
      },
    ]);
  });

  it("offers no action for waiting, terminal statuses", () => {
    for (const status of [
      "pending_payment",
      "delivered",
      "cancelled",
      "rejected",
    ] as const) {
      expect(getAdminOrderActions(status)).toEqual([]);
    }
  });
});

describe("findAction", () => {
  it("returns the spec for a legal id, null otherwise", () => {
    expect(findAction("verify", "pending_verification")?.target).toBe("paid");
    expect(findAction("verify", "paid")).toBeNull();
    expect(findAction("start-assembly", "processing")).toBeNull();
  });
});
