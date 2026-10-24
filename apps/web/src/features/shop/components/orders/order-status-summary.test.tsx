import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { OrderStatusSummary } from "./order-status-summary";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const ORDERS = createDemoOrders(NOW);

describe("OrderStatusSummary", () => {
  it("renders the status heading, code, badge, and timeline", () => {
    const order = ORDERS.find((item) => item.status === "paid");
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderStatusSummary order={order} />);

    expect(screen.getByText("Status Pesanan")).toBeInTheDocument();
    expect(screen.getByText(order.code)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pembayaran Terverifikasi" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Pembayaran Terverifikasi")).toHaveLength(3);
    expect(screen.getAllByTestId("order-timeline-stage")).toHaveLength(6);
  });

  it("shows the terminal alert for a cancelled order", () => {
    const order = ORDERS.find((item) => item.status === "cancelled");
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderStatusSummary order={order} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dibatalkan oleh admin",
    );
  });

  it("shows the completion date for a delivered order", () => {
    const order = ORDERS.find((item) => item.status === "delivered");
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderStatusSummary order={order} />);
    expect(screen.getByText(/Pesanan selesai pada/)).toBeInTheDocument();
  });
});
