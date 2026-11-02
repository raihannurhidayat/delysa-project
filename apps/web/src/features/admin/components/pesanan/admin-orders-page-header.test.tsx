import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOrdersPageHeader } from "./admin-orders-page-header";
import {
  AdminOrderStatsCards,
  type AdminOrderQueue,
} from "./admin-order-stats-cards";

describe("AdminOrdersPageHeader", () => {
  it("renders the back-office heading and manual order button", () => {
    render(<AdminOrdersPageHeader onCreateManual={() => {}} />);

    expect(
      screen.getByRole("heading", {
        name: "Manajemen Pesanan & Antrian Fulfillment",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buat Pesanan Manual" }),
    ).toBeInTheDocument();
  });

  it("calls onCreateManual when the button is clicked", () => {
    const onCreateManual = vi.fn();
    render(<AdminOrdersPageHeader onCreateManual={onCreateManual} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Buat Pesanan Manual" }),
    );

    expect(onCreateManual).toHaveBeenCalledTimes(1);
  });
});

describe("AdminOrderStatsCards", () => {
  it("renders the three queue counts", () => {
    render(
      <AdminOrderStatsCards
        verification={3}
        assembly={1}
        delivery={2}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Menunggu Verifikasi Resi")).toBeInTheDocument();
    expect(screen.getByText("Sedang Dirangkai Hari Ini")).toBeInTheDocument();
    expect(screen.getByText("Dalam Pengantaran")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("selects the matching queue when a card is clicked", () => {
    const onSelect = vi.fn<(queue: AdminOrderQueue) => void>();
    render(
      <AdminOrderStatsCards
        verification={3}
        assembly={1}
        delivery={2}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("Sedang Dirangkai Hari Ini"));
    fireEvent.click(screen.getByText("Dalam Pengantaran"));

    expect(onSelect).toHaveBeenNthCalledWith(1, "assembly");
    expect(onSelect).toHaveBeenNthCalledWith(2, "delivery");
  });
});
