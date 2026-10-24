import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { OrderStatusTimeline } from "./order-status-timeline";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const ORDERS = createDemoOrders(NOW);

describe("OrderStatusTimeline", () => {
  it("renders six stages in order", () => {
    const order = ORDERS.find((item) => item.status === "paid");
    expect(order).toBeDefined();
    if (!order) return;
    render(
      <OrderStatusTimeline events={order.timeline} status={order.status} />,
    );
    const stages = screen.getAllByTestId("order-timeline-stage");
    expect(stages).toHaveLength(6);
    expect(stages[0]).toHaveAttribute("data-state", "done");
    expect(stages[1]).toHaveAttribute("data-state", "done");
    expect(stages[2]).toHaveAttribute("data-state", "current");
    expect(stages[3]).toHaveAttribute("data-state", "upcoming");
    expect(stages[5]).toHaveAttribute("data-state", "upcoming");
  });

  it("shows a terminal alert for cancelled orders", () => {
    const order = ORDERS.find((item) => item.status === "cancelled");
    expect(order).toBeDefined();
    if (!order) return;
    render(
      <OrderStatusTimeline events={order.timeline} status={order.status} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dibatalkan oleh admin",
    );
    const stages = screen.getAllByTestId("order-timeline-stage");
    expect(stages[0]).toHaveAttribute("data-state", "current");
    expect(stages[1]).toHaveAttribute("data-state", "upcoming");
  });
});
