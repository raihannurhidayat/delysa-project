import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDemoOrders } from "~/features/shop/data/orders";
import { formatIDR } from "~/features/shop/lib/format";
import { OrderPaymentCard } from "./order-payment-card";

const NOW = new Date("2026-10-24T12:00:00.000Z");
const ORDERS = createDemoOrders(NOW);
const onStatusChange = vi.fn();

describe("OrderPaymentCard", () => {
  it("renders BCA details, total, and countdown", () => {
    const order = ORDERS.find((item) => item.code.endsWith("8842"));
    expect(order).toBeDefined();
    if (!order) return;
    render(
      <OrderPaymentCard
        order={{
          ...order,
          paymentDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText("Transfer Manual BCA")).toBeInTheDocument();
    expect(
      screen.getByText(formatIDR(order.totals.grandTotal)),
    ).toBeInTheDocument();
    expect(screen.getByText("054-082-9912")).toBeInTheDocument();
    expect(screen.getByText("a.n. Kartinah")).toBeInTheDocument();
    expect(screen.getByText(/Sisa waktu/)).toBeInTheDocument();
    expect(screen.getByText(/Bayar sebelum/)).toBeInTheDocument();
    expect(screen.getByTestId("payment-proof-input")).toBeInTheDocument();
  });

  it("renders QRIS without a bank account and with a QRIS CTA", () => {
    const order = ORDERS.find((item) => item.code.endsWith("7710"));
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderPaymentCard order={order} onStatusChange={onStatusChange} />);

    expect(screen.getByText("QRIS")).toBeInTheDocument();
    expect(screen.queryByText("054-082-9912")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Minta QRIS via WhatsApp" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bukti pembayaran sedang diverifikasi admin."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("payment-proof-input")).not.toBeInTheDocument();
  });

  it("hides the uploader for paid orders", () => {
    const order = ORDERS.find((item) => item.status === "paid");
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderPaymentCard order={order} onStatusChange={onStatusChange} />);
    expect(screen.getByText("Pembayaran terverifikasi.")).toBeInTheDocument();
    expect(screen.queryByTestId("payment-proof-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("upload-success")).not.toBeInTheDocument();
  });

  it("shows the rejection alert and WhatsApp CTA", () => {
    const order = ORDERS.find((item) => item.status === "rejected");
    expect(order).toBeDefined();
    if (!order) return;
    render(<OrderPaymentCard order={order} onStatusChange={onStatusChange} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Pembayaran ditolak");
    expect(
      screen.getByRole("link", { name: "Konfirmasi via WhatsApp" }),
    ).toBeInTheDocument();
  });

  it("keeps the uploader visible after the deadline passes", () => {
    const order = ORDERS.find((item) => item.code.endsWith("8842"));
    expect(order).toBeDefined();
    if (!order) return;
    render(
      <OrderPaymentCard
        order={{
          ...order,
          paymentDeadline: "2026-10-20T00:00:00.000Z",
        }}
        onStatusChange={onStatusChange}
      />,
    );
    expect(
      screen.getByText("Batas pembayaran telah lewat"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("payment-proof-input")).toBeInTheDocument();
  });
});
