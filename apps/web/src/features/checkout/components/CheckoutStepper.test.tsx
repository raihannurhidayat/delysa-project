import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CheckoutStepper } from "./CheckoutStepper";

describe("CheckoutStepper", () => {
  it("renders all 4 steps with labels", () => {
    render(<CheckoutStepper currentStep="alamat" onStepClick={vi.fn()} />);
    expect(screen.getByText("Review Keranjang")).toBeInTheDocument();
    expect(screen.getByText("Alamat Pengiriman")).toBeInTheDocument();
    expect(screen.getByText("Metode Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan & Bayar")).toBeInTheDocument();
  });

  it("marks the current step with aria-current=step", () => {
    render(<CheckoutStepper currentStep="bayar" onStepClick={vi.fn()} />);
    const current = screen.getByRole("button", {
      name: /Langkah 3: Metode Pembayaran/,
    });
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("calls onStepClick for completed steps only", () => {
    const handleClick = vi.fn();
    render(<CheckoutStepper currentStep="bayar" onStepClick={handleClick} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Langkah 1: Review Keranjang/ }),
    );
    expect(handleClick).toHaveBeenCalledWith("review");

    handleClick.mockClear();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Langkah 4: Ringkasan & Bayar/,
      }),
    );
    expect(handleClick).not.toHaveBeenCalled();
  });
});
