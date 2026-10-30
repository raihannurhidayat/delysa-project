import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductsTable } from "./products-table";
import { ProductsPagination } from "./products-pagination";
import { MOCK_PRODUCTS } from "../lib/mock-products";

describe("ProductsTable", () => {
  it("renders a row per product with stock badge and public status", () => {
    render(
      <ProductsTable
        products={MOCK_PRODUCTS.slice(0, 3)}
        hasFilters={false}
        onEdit={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows

    const habisRow = screen.getByRole("row", {
      name: /Aura Botanical Grand Stand/,
    });
    expect(within(habisRow).getByText("Habis")).toBeInTheDocument();
    expect(within(habisRow).getByText("Draf")).toBeInTheDocument();

    const amanRow = screen.getByRole("row", {
      name: /The Grand Monolith/,
    });
    expect(within(amanRow).getByText("Aman")).toBeInTheDocument();
    expect(within(amanRow).getByText("Aktif di Web")).toBeInTheDocument();
  });

  it("calls onEdit with the clicked product", () => {
    const onEdit = vi.fn();
    render(
      <ProductsTable
        products={MOCK_PRODUCTS.slice(0, 2)}
        hasFilters={false}
        onEdit={onEdit}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit produk The Grand Monolith Peach & Ivory",
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(MOCK_PRODUCTS[0]);
  });

  it("shows a filtered empty state with reset, distinct from the empty catalog state", () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <ProductsTable
        products={[]}
        hasFilters
        onEdit={vi.fn()}
        onReset={onReset}
      />,
    );

    expect(screen.getByText(/tidak ada produk yang cocok/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(onReset).toHaveBeenCalled();

    rerender(
      <ProductsTable
        products={[]}
        hasFilters={false}
        onEdit={vi.fn()}
        onReset={onReset}
      />,
    );
    expect(screen.getByText("Belum ada produk")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset filter" }),
    ).not.toBeInTheDocument();
  });
});

describe("ProductsPagination", () => {
  it("shows the result range and disables prev on the first page", () => {
    render(
      <ProductsPagination
        page={1}
        totalPages={2}
        totalItems={12}
        perPage={8}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Menampilkan 1–8 dari 12 produk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Halaman sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Halaman berikutnya" })).toBeEnabled();
  });

  it("marks the current page and reports page changes", () => {
    const onPageChange = vi.fn();
    render(
      <ProductsPagination
        page={1}
        totalPages={2}
        totalItems={12}
        perPage={8}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Halaman 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(screen.getByRole("button", { name: "Halaman 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("renders nothing for a single page", () => {
    render(
      <ProductsPagination
        page={1}
        totalPages={1}
        totalItems={5}
        perPage={8}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
