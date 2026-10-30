import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AdminProduct } from "../../lib/products/product.types";
import { ProductFormDialog } from "./product-form-dialog";

const product: AdminProduct = {
  id: 7,
  name: "Serenade Pastel Petite Wrap",
  sku: "DF-WRAP-115",
  category: "Buket",
  price: 320000,
  stock: 19,
  stockUnit: "Buket",
  minThreshold: 6,
  sales: 231,
  rating: 4.8,
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
    fireEvent.click(screen.getByRole("button", { name: "Tambah Produk" }));

    expect(
      await screen.findByText("Nama minimal 2 karakter"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("SKU minimal 3 karakter"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid create payload including sales and rating", async () => {
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
    fireEvent.input(screen.getByLabelText("Jumlah Terjual"), {
      target: { value: "12" },
    });
    fireEvent.input(screen.getByLabelText("Rating (0–5)"), {
      target: { value: "4.7" },
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
          sales: 12,
          rating: 4.7,
        }),
      );
    });
  });

  it("rejects ratings outside 0–5", async () => {
    render(
      <ProductFormDialog
        open
        onOpenChange={vi.fn()}
        product={product}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.input(screen.getByLabelText("Rating (0–5)"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    expect(await screen.findByText("Rating maksimal 5")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Jumlah Terjual")).toHaveValue(product.sales);
    expect(
      screen.getByRole("button", { name: "Simpan Perubahan" }),
    ).toBeInTheDocument();
  });
});
