import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OrderHistoryLocked } from "./order-history-locked";

describe("OrderHistoryLocked", () => {
  it("forwards sign-in and lookup actions", () => {
    const onSignIn = vi.fn();
    const onLookup = vi.fn();
    render(<OrderHistoryLocked onSignIn={onSignIn} onLookup={onLookup} />);

    expect(screen.getByText("Riwayat pesanan terkunci")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Masuk ke akun" }));
    expect(onSignIn).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Kode pesanan"), {
      target: { value: "dlf-20261024-8842" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lacak" }));
    expect(onLookup).toHaveBeenCalledWith("DLF-20261024-8842");
    expect(
      screen.getByText("Pelacakan dengan kode tetap tersedia tanpa masuk."),
    ).toBeInTheDocument();
  });
});
