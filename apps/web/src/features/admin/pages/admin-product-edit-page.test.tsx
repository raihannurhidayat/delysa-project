import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminProductById,
  resetAdminProducts,
} from "../lib/products/product-store";
import { AdminProductEditPage } from "./admin-product-edit-page";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
    onClick,
  }: {
    to: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("AdminProductEditPage", () => {
  beforeEach(() => {
    resetAdminProducts();
  });

  it("renders existing product details and performance metrics for editing", () => {
    render(<AdminProductEditPage productId={1} />);

    expect(
      screen.getByRole("heading", { name: "Edit Produk" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Produk/i)).toHaveValue(
      "The Grand Monolith Peach & Ivory",
    );
    expect(screen.getByLabelText(/Kode SKU/i)).toHaveValue("DF-MONO-889");
    expect(
      screen.getByText("MODE PEMBARUAN KATALOG ATELIER"),
    ).toBeInTheDocument();
  });

  it("supports quick stock adjustment and saves updated product into the store", () => {
    const onSuccess = vi.fn();
    render(<AdminProductEditPage productId={1} onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/Nama Produk/i);
    fireEvent.change(nameInput, {
      target: { value: "Buket Mawar Merah Deluxe Tasik" },
    });

    fireEvent.click(screen.getByRole("button", { name: "+5 Restock" }));
    expect(screen.getByLabelText(/Stok Saat Ini/i)).toHaveValue(19);

    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0]?.[1]).toBe("update");

    const updated = getAdminProductById(1);
    expect(updated?.name).toBe("Buket Mawar Merah Deluxe Tasik");
    expect(updated?.stock).toBe(19);
  });

  it("renders a not-found state when productId does not exist", () => {
    render(<AdminProductEditPage productId={9999} />);

    expect(
      screen.getByRole("heading", { name: "Produk Tidak Ditemukan" }),
    ).toBeInTheDocument();
  });
});
