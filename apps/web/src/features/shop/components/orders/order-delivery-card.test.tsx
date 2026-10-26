import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { OrderDeliveryCard } from "./order-delivery-card";

const ORDERS = createDemoOrders(new Date("2026-10-24T12:00:00.000Z"));

describe("OrderDeliveryCard", () => {
  it("masks personal data for guests", () => {
    const order = ORDERS.find((item) => item.code.endsWith("8842"));
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderDeliveryCard order={order} isAuthenticated={false} />);

    expect(screen.getByText("Sari A***")).toBeInTheDocument();
    expect(screen.getByText("0821****558")).toBeInTheDocument();
    expect(
      screen.getByText(/alamat lengkap disembunyikan/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Masuk ke akun/)).toBeInTheDocument();
  });

  it("shows full data for signed-in users", () => {
    const order = ORDERS.find((item) => item.code.endsWith("8842"));
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderDeliveryCard order={order} isAuthenticated />);

    expect(screen.getByText(order.recipientName)).toBeInTheDocument();
    expect(screen.getByText(order.recipientPhone)).toBeInTheDocument();
    expect(screen.getByText(order.shippingAddress)).toBeInTheDocument();
    expect(screen.queryByText(/Masuk ke akun/)).not.toBeInTheDocument();
  });

  it("shows courier, tracking number, and custom note", () => {
    const order = ORDERS.find((item) => item.status === "shipped");
    expect(order).toBeDefined();
    if (!order) return;
    render(
      <OrderDeliveryCard
        order={{ ...order, customNote: "Kirim pagi" }}
        isAuthenticated
      />,
    );
    expect(screen.getByText(/JNE/)).toBeInTheDocument();
    expect(screen.getByText(/JNE-/)).toBeInTheDocument();
    expect(screen.getByText("Catatan")).toBeInTheDocument();
    expect(screen.getByText("Kirim pagi")).toBeInTheDocument();
  });
});
