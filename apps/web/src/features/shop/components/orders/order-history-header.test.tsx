import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderHistoryHeader } from "./order-history-header";

describe("OrderHistoryHeader", () => {
  it("renders the heading and WhatsApp CTA for guests", () => {
    render(<OrderHistoryHeader />);

    expect(
      screen.getByRole("heading", { name: "Pesanan Saya" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Halo, Sari/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toBeInTheDocument();
  });

  it("greets the signed-in customer", () => {
    render(<OrderHistoryHeader userName="Sari Amelia" />);
    expect(screen.getByText(/Halo, Sari/)).toBeInTheDocument();
  });
});
