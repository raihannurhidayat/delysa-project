import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOrderStatusTabs } from "./admin-order-status-tabs";
import { ADMIN_TAB_LABELS } from "../../lib/pesanan/admin-order-filters";
import type { OrderTab } from "~/features/shop/types";

const COUNTS: Record<OrderTab, number> = {
  all: 16,
  pending_payment: 2,
  pending_verification: 5,
  paid: 3,
  processing: 2,
  shipped: 1,
  delivered: 2,
  closed: 1,
};

describe("AdminOrderStatusTabs", () => {
  it("renders all eight tabs with labels and counts", () => {
    render(
      <AdminOrderStatusTabs value="all" counts={COUNTS} onChange={() => {}} />,
    );

    const tablist = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(8);

    expect(tablist).toBeInTheDocument();
    expect(
      screen.getByText(ADMIN_TAB_LABELS.pending_verification),
    ).toBeInTheDocument();
    expect(screen.getByText(ADMIN_TAB_LABELS.closed)).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("marks the active tab with aria-selected", () => {
    render(
      <AdminOrderStatusTabs
        value="processing"
        counts={COUNTS}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByRole("tab", { name: /Sedang Dirangkai/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Semua/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onChange with the selected tab", () => {
    const onChange = vi.fn<(tab: OrderTab) => void>();
    render(
      <AdminOrderStatusTabs value="all" counts={COUNTS} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Dalam Pengantaran/ }));

    expect(onChange).toHaveBeenCalledWith("shipped");
  });
});
