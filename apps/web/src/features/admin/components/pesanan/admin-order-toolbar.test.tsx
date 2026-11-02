import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOrderToolbar } from "./admin-order-toolbar";
import { DEFAULT_ADMIN_ORDER_FILTERS } from "../../lib/pesanan/admin-order-filters";
import type { AdminOrderFilters } from "../../lib/pesanan/admin-order.types";

function setup(filters: AdminOrderFilters) {
  const onChange = vi.fn<(next: AdminOrderFilters) => void>();
  const onReset = vi.fn<() => void>();

  render(
    <AdminOrderToolbar
      filters={filters}
      onChange={onChange}
      resultCount={7}
      onReset={onReset}
    />,
  );

  return { onChange, onReset };
}

describe("AdminOrderToolbar", () => {
  it("renders search, period, batch, reset, and a live result count", () => {
    setup(DEFAULT_ADMIN_ORDER_FILTERS);

    expect(
      screen.getByPlaceholderText(
        "Cari no. order, produk, atau nama pelanggan…",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 7 pesanan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Periode pesanan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Batch pesanan" }),
    ).toBeInTheDocument();
  });

  it("emits a new filters object when searching", () => {
    const { onChange } = setup(DEFAULT_ADMIN_ORDER_FILTERS);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Cari no. order, produk, atau nama pelanggan…",
      ),
      { target: { value: "DLF-2026" } },
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "DLF-2026" }),
    );
  });

  it("shows exactly the same string for the live count region", () => {
    setup({ ...DEFAULT_ADMIN_ORDER_FILTERS, search: "mawar" });

    const live = screen.getByText(/Menampilkan/);
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("Reset is disabled while filters are default", () => {
    setup(DEFAULT_ADMIN_ORDER_FILTERS);

    expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();
  });
});
