import { describe, expect, it } from "vitest";
import { orderHistorySearchSchema } from "./order-history-search-schema";

describe("order history search schema", () => {
  it("fills defaults", () => {
    expect(orderHistorySearchSchema.parse({})).toEqual({
      period: "30d",
      sort: "newest",
      status: "all",
      page: 1,
    });
  });

  it("coerces page numbers", () => {
    expect(orderHistorySearchSchema.parse({ page: "3" }).page).toBe(3);
  });

  it("falls back for invalid values", () => {
    expect(
      orderHistorySearchSchema.parse({
        page: "abc",
        period: "x",
        sort: "x",
        status: "x",
      }),
    ).toEqual({
      period: "30d",
      sort: "newest",
      status: "all",
      page: 1,
    });
  });

  it("drops invalid query strings", () => {
    expect(orderHistorySearchSchema.parse({ q: 42 }).q).toBeUndefined();
    expect(
      orderHistorySearchSchema.parse({ q: "x".repeat(101) }).q,
    ).toBeUndefined();
  });
});
