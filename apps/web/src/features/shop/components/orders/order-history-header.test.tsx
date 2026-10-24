import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderHistoryHeader } from "./order-history-header";

describe("OrderHistoryHeader", () => {
  it("renders the heading and WhatsApp CTA for guests", () => {
    render(<OrderHistoryHeader isCustomer={false} />);

    expect(
      screen.getByRole("heading", { name: "Pesanan Saya" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Halo, Sari/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toBeInTheDocument();
  });

  it("greets the demo customer", () => {
    render(<OrderHistoryHeader isCustomer />);
    expect(screen.getByText(/Halo, Sari/)).toBeInTheDocument();
  });
});
