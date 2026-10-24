import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderHistoryEmpty } from "./order-history-empty";

describe("OrderHistoryEmpty", () => {
  it("browses the catalog and forwards order lookups", () => {
    const onBrowse = vi.fn();
    const onLookup = vi.fn();
    render(<OrderHistoryEmpty onBrowse={onBrowse} onLookup={onLookup} />);

    expect(screen.getByText("Belum ada pesanan")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Jelajahi katalog" }));
    expect(onBrowse).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "dlf-20261024-8842" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onLookup).toHaveBeenCalledWith("DLF-20261024-8842");
  });
});
