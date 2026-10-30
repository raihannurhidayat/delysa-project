import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductFormDialog } from "./product-form-dialog";
import type { AdminProduct } from "../lib/product.types";

const product: AdminProduct = {
  id: 7,
  name: "Serenade Pastel Petite Wrap",
  sku: "DF-WRAP-115",
  category: "Buket",
  price: 320000,
  stock: 19,
  stockUnit: "Buket",
  minThreshold: 6,
  isPublished: true,
};

describe("ProductFormDialog", () => {
  it("blocks empty submit with validation messages in create mode", async () => {
    const onSubmit = vi.fn();
    render(
      <ProductFormDialog
        open
        onOpenChange={vi.fn()}
        product={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.input(screen.getByLabelText("Nama Produk"), {
      target: { value: "" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Tambah Produk" }),
    );

    expect(
      await screen.findByText("Nama minimal 2 karakter"),
    ).toBeInTheDocument();
    expect(await screen.findByText("SKU minimal 3 karakter")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid create payload", async () => {
    const onSubmit = vi.fn();
    render(
      <ProductFormDialog
        open
        onOpenChange={vi.fn()}
        product={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.input(screen.getByLabelText("Nama Produk"), {
      target: { value: "Buket Mawar Uji" },
    });
    fireEvent.input(screen.getByLabelText("SKU"), {
      target: { value: "DF-UJI-001" },
    });
    fireEvent.input(screen.getByLabelText("Harga (Rp)"), {
      target: { value: "150000" },
    });
    fireEvent.input(screen.getByLabelText("Stok"), {
      target: { value: "5" },
    });
    fireEvent.input(screen.getByLabelText("Satuan Stok"), {
      target: { value: "Buket" },
    });
    fireEvent.input(screen.getByLabelText("Threshold Minimum"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tambah Produk" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Buket Mawar Uji",
          sku: "DF-UJI-001",
          price: 150000,
          stock: 5,
          minThreshold: 3,
        }),
      );
    });
  });

  it("prefills values in edit mode", () => {
    render(
      <ProductFormDialog
        open
        onOpenChange={vi.fn()}
        product={product}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Nama Produk")).toHaveValue(product.name);
    expect(screen.getByLabelText("SKU")).toHaveValue(product.sku);
    expect(screen.getByLabelText("Stok")).toHaveValue(product.stock);
    expect(screen.getByRole("button", { name: "Simpan Perubahan" })).toBeInTheDocument();
  });
});
