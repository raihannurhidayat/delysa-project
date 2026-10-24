import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { formatIDR } from "~/features/shop/lib/format";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { OrderHistoryCard } from "./order-history-card";

const ORDERS = createDemoOrders(new Date("2026-10-24T12:00:00.000Z"));

function findOrder(suffix: string) {
  const order = ORDERS.find((item) => item.code.endsWith(suffix));
  if (!order) throw new Error(`Order ${suffix} not found`);
  return order;
}

describe("OrderHistoryCard", () => {
  it("renders the order summary and opens a pending order", () => {
    const order = findOrder("8842");
    const onOpen = vi.fn();
    render(
      <OrderHistoryCard order={order} onOpen={onOpen} onReorder={vi.fn()} />,
    );

    expect(screen.getByText(order.code)).toBeInTheDocument();
    expect(
      screen.getByText(formatOrderDate(order.createdAt)),
    ).toBeInTheDocument();
    expect(screen.getByText("Menunggu Pembayaran")).toBeInTheDocument();
    expect(screen.getByText(order.items[0].name)).toBeInTheDocument();
    expect(
      screen.getByText(formatIDR(order.totals.grandTotal)),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bayar sekarang" }));
    expect(onOpen).toHaveBeenCalledWith(order);
  });

  it("reorders and opens a delivered order", () => {
    const order = findOrder("3308");
    const onOpen = vi.fn();
    const onReorder = vi.fn();
    render(
      <OrderHistoryCard order={order} onOpen={onOpen} onReorder={onReorder} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pesan lagi" }));
    expect(onReorder).toHaveBeenCalledWith(order);
    fireEvent.click(screen.getByRole("button", { name: "Lihat detail" }));
    expect(onOpen).toHaveBeenCalledWith(order);
  });

  it("shows detail and WhatsApp actions for a cancelled order", () => {
    const order = findOrder("2217");
    const onOpen = vi.fn();
    render(
      <OrderHistoryCard order={order} onOpen={onOpen} onReorder={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Lihat detail" }));
    expect(onOpen).toHaveBeenCalledWith(order);
    expect(
      screen.getByRole("link", { name: "Tanya via WhatsApp" }),
    ).toHaveAttribute("href", expect.stringContaining("wa.me"));
  });

  it("summarizes additional items", () => {
    const order = findOrder("8842");
    const extraItem = findOrder("6621").items[0];
    render(
      <OrderHistoryCard
        order={{ ...order, items: [...order.items, extraItem] }}
        onOpen={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText("+1 item lainnya")).toBeInTheDocument();
  });
});
