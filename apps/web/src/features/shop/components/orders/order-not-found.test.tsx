import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderNotFound } from "./order-not-found";

describe("OrderNotFound", () => {
  it("shows the searched code and a lookup form", () => {
    const onLookup = vi.fn();
    render(<OrderNotFound code="DLF-UNKNOWN" onLookup={onLookup} />);
    expect(screen.getByText("DLF-UNKNOWN")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "dlf-20261024-8842" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onLookup).toHaveBeenCalledWith("DLF-20261024-8842");
  });

  it("offers a WhatsApp CTA", () => {
    render(<OrderNotFound code="DLF-UNKNOWN" onLookup={vi.fn()} />);
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
  });
});
