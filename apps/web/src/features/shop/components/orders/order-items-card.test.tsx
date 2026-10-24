import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { formatIDR } from "~/features/shop/lib/format";
import { OrderItemsCard } from "./order-items-card";

const ORDERS = createDemoOrders(new Date("2026-10-24T12:00:00.000Z"));

describe("OrderItemsCard", () => {
  it("renders items, variants, quantities, and totals", () => {
    const order = ORDERS.find((item) => item.code.endsWith("8842"));
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderItemsCard order={order} />);

    expect(screen.getByText(order.items[0].name)).toBeInTheDocument();
    expect(screen.getAllByText(/1 × Rp/)).toHaveLength(order.items.length);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Diskon produk")).toBeInTheDocument();
    expect(screen.getByText("Ongkos kirim")).toBeInTheDocument();
    expect(screen.getByText("Kupon")).toBeInTheDocument();
    expect(screen.getByText("Grand total")).toBeInTheDocument();
    expect(screen.getAllByText(/Rp/).length).toBeGreaterThan(0);
  });

  it("renders free shipping and the coupon discount", () => {
    const order = ORDERS.find((item) => item.code.endsWith("3308"));
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderItemsCard order={order} />);
    expect(screen.getByText("GRATIS")).toBeInTheDocument();
    expect(
      screen.getByText(formatIDR(order.totals.couponDiscount)),
    ).toBeInTheDocument();
  });
});
