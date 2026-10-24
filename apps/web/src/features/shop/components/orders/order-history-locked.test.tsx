import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderHistoryLocked } from "./order-history-locked";

describe("OrderHistoryLocked", () => {
  it("enables the demo login and forwards lookups", () => {
    const onEnableDemo = vi.fn();
    const onLookup = vi.fn();
    render(
      <OrderHistoryLocked onEnableDemo={onEnableDemo} onLookup={onLookup} />,
    );

    expect(screen.getByText("Riwayat pesanan terkunci")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan login demo" }),
    );
    expect(onEnableDemo).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "dlf-20261024-8842" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onLookup).toHaveBeenCalledWith("DLF-20261024-8842");
    expect(
      screen.getByText("Mode demo ini hanya menyimpan data di browser."),
    ).toBeInTheDocument();
  });
});
