import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusBadge } from "./order-status-badge";

describe("OrderStatusBadge", () => {
  it("renders the full label and status attribute", () => {
    render(<OrderStatusBadge status="pending_payment" />);
    expect(screen.getByText("Menunggu Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Menunggu Pembayaran")).toHaveAttribute(
      "data-status",
      "pending_payment",
    );
  });

  it("renders delivered as selesai", () => {
    render(<OrderStatusBadge status="delivered" />);
    expect(screen.getByText("Selesai")).toBeInTheDocument();
  });

  it("uses the danger tone for cancelled", () => {
    render(<OrderStatusBadge status="cancelled" />);
    expect(screen.getByText("Dibatalkan")).toHaveClass("text-rose-700");
  });
});
