import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderCodeLookupForm } from "./order-code-lookup-form";

describe("OrderCodeLookupForm", () => {
  it("requires a code", () => {
    const onSubmit = vi.fn();
    render(<OrderCodeLookupForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Masukkan kode pesanan",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("normalizes the code before submitting", () => {
    const onSubmit = vi.fn();
    render(<OrderCodeLookupForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "  dlf-20261024-8842 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onSubmit).toHaveBeenCalledWith("DLF-20261024-8842");
  });

  it("starts with the initial code", () => {
    render(
      <OrderCodeLookupForm
        initialCode="DLF-20261024-8842"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Kode pesanan")).toHaveValue(
      "DLF-20261024-8842",
    );
  });
});
