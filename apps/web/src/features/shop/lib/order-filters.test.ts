import { describe, expect, it } from "vitest";
import { createDemoOrders } from "~/features/shop/data/orders";
import {
  countOrdersByTab,
  filterOrders,
  paginateOrders,
  sortOrders,
} from "./order-filters";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const ORDERS = createDemoOrders(NOW);

describe("order filters", () => {
  it("searches code, item name, and recipient name case-insensitively", () => {
    expect(
      filterOrders(ORDERS, { q: "8842", period: "all", status: "all" }, NOW),
    ).toHaveLength(1);
    expect(
      filterOrders(ORDERS, { q: "mawar", period: "all", status: "all" }, NOW)
        .length,
    ).toBeGreaterThan(0);
    expect(
      filterOrders(ORDERS, { q: "sari", period: "all", status: "all" }, NOW)
        .length,
    ).toBeGreaterThan(0);
  });

  it("applies period cutoffs", () => {
    expect(
      filterOrders(ORDERS, { period: "30d", status: "all" }, NOW),
    ).toHaveLength(14);
    expect(
      filterOrders(ORDERS, { period: "90d", status: "all" }, NOW),
    ).toHaveLength(15);
    expect(
      filterOrders(ORDERS, { period: "1y", status: "all" }, NOW),
    ).toHaveLength(16);
  });

  it("groups closed statuses", () => {
    expect(
      filterOrders(ORDERS, { period: "all", status: "closed" }, NOW),
    ).toHaveLength(3);
    expect(
      filterOrders(ORDERS, { period: "all", status: "delivered" }, NOW),
    ).toHaveLength(5);
  });

  it("counts tabs after query and period, before status", () => {
    const counts = countOrdersByTab(ORDERS, { period: "30d" }, NOW);
    expect(counts.all).toBe(14);
    expect(counts.pending_payment).toBe(1);
    expect(counts.pending_verification).toBe(2);
    expect(counts.paid).toBe(2);
    expect(counts.processing).toBe(2);
    expect(counts.shipped).toBe(1);
    expect(counts.delivered).toBe(4);
    expect(counts.closed).toBe(2);
  });

  it("sorts by date and total", () => {
    const newest = sortOrders(ORDERS, "newest");
    const oldest = sortOrders(ORDERS, "oldest");
    const total = sortOrders(ORDERS, "total_desc");

    expect(Date.parse(newest[0].createdAt)).toBeGreaterThanOrEqual(
      Date.parse(newest[1].createdAt),
    );
    expect(Date.parse(oldest[0].createdAt)).toBeLessThanOrEqual(
      Date.parse(oldest[1].createdAt),
    );
    expect(total[0].totals.grandTotal).toBeGreaterThanOrEqual(
      total[1].totals.grandTotal,
    );
  });

  it("paginates and clamps pages", () => {
    const first = paginateOrders(ORDERS, 1, 4);
    expect(first.items).toHaveLength(4);
    expect(first.pageCount).toBe(4);
    expect(first.total).toBe(16);

    expect(paginateOrders(ORDERS, 99, 4).page).toBe(4);
    expect(paginateOrders([], 2, 4)).toMatchObject({
      items: [],
      page: 1,
      pageCount: 1,
      total: 0,
    });
  });
});
