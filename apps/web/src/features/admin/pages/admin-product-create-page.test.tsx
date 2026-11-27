import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminProducts,
  resetAdminProducts,
} from "../lib/products/product-store";
import { AdminProductCreatePage } from "./admin-product-create-page";

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

describe("AdminProductCreatePage", () => {
  beforeEach(() => {
    resetAdminProducts();
  });

  it("renders all dedicated create product sections and Atelier guidelines", () => {
    render(<AdminProductCreatePage />);

    expect(
      screen.getByRole("heading", { name: "Tambah Produk Baru" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("FILOSOFI DREAMINEERING ATELIER"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Informasi Dasar & Klasifikasi/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Status & Konfigurasi/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Harga & Inventaris Stok Segar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Deskripsi & Komposisi Botani/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Galeri Visual Etalase/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Panduan Fotografi Atelier/i }),
    ).toBeInTheDocument();
  });

  it("auto-generates slug and SKU when the product name changes", () => {
    render(<AdminProductCreatePage />);

    const nameInput = screen.getByLabelText(/Nama Produk/i);
    fireEvent.change(nameInput, {
      target: { value: "Buket Mawar Senja Tasik" },
    });

    const slugInput = screen.getByLabelText(/Slug URL Otomatis/i);
    expect(slugInput).toHaveValue("buket-mawar-senja-tasik");
  });

  it("adds and removes botanical specification tags", () => {
    render(<AdminProductCreatePage />);

    expect(screen.getByText("Ecuadorian Roses")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Hapus Ecuadorian Roses" }),
    );
    expect(screen.queryByText("Ecuadorian Roses")).not.toBeInTheDocument();

    const tagInput = screen.getByPlaceholderText("+ Ketik nama bunga & Enter");
    fireEvent.change(tagInput, { target: { value: "Peony Pink Blush" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    expect(screen.getByText("Peony Pink Blush")).toBeInTheDocument();
  });

  it("saves the new product as published or draft into the store", () => {
    const onSuccess = vi.fn();
    render(<AdminProductCreatePage onSuccess={onSuccess} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Simpan Produk \(Tayangkan\)/i }),
    );

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0]?.[1]).toBe("publish");
    expect(getAdminProducts()[0]?.name).toBe(
      "The Grand Monolith Peach & Ivory",
    );
    expect(getAdminProducts()[0]?.isPublished).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: /Simpan sebagai Draft/i }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(2);
    expect(onSuccess.mock.calls[1]?.[1]).toBe("draft");
    expect(getAdminProducts()[0]?.isPublished).toBe(false);
  });
});
