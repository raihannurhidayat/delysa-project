import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ORDER_TABS } from "~/features/shop/lib/order-filters";
import type { OrderTab } from "~/features/shop/types";
import { OrderHistoryTabs } from "./order-history-tabs";

const counts = ORDER_TABS.reduce(
  (result, tab) => {
    result[tab.value] = 2;
    return result;
  },
  {} as Record<OrderTab, number>,
);

describe("OrderHistoryTabs", () => {
  it("renders every tab with its count", () => {
    render(<OrderHistoryTabs value="all" counts={counts} onChange={vi.fn()} />);

    const group = screen.getByRole("group", {
      name: "Filter status pesanan",
    });
    expect(within(group).getAllByRole("button")).toHaveLength(8);
    expect(within(group).getByText("Semua")).toBeInTheDocument();
    expect(within(group).getAllByText("2")).toHaveLength(8);
  });

  it("calls onChange and marks the active tab", () => {
    const onChange = vi.fn();
    render(
      <OrderHistoryTabs value="all" counts={counts} onChange={onChange} />,
    );

    const delivered = screen.getByRole("button", { name: /Selesai/ });
    fireEvent.click(delivered);
    expect(onChange).toHaveBeenCalledWith("delivered");
    expect(screen.getByRole("button", { name: /Semua/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
