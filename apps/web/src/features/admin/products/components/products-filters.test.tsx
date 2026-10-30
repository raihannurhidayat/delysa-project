import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductsStatsCards } from "./products-stats-cards";
import { ProductsFilters } from "./products-filters";
import { MOCK_PRODUCTS } from "../lib/mock-products";
import { DEFAULT_PRODUCT_FILTERS, type ProductFilters } from "../lib/product.types";

describe("ProductsStatsCards", () => {
  it("renders catalog summary numbers from the product list", () => {
    render(<ProductsStatsCards products={MOCK_PRODUCTS} />);

    expect(screen.getByText("Peringatan Low-Stock")).toBeInTheDocument();
    expect(screen.getByText(/4 Perlu Restock/)).toBeInTheDocument();
    expect(screen.getByText(/2 Out of Stock/)).toBeInTheDocument();
    expect(screen.getByText(/9 tayang publik di web/)).toBeInTheDocument();
  });
});

describe("ProductsFilters", () => {
  const baseFilters: ProductFilters = { ...DEFAULT_PRODUCT_FILTERS };

  it("calls onChange with the new search value", () => {
    const onChange = vi.fn();
    render(
      <ProductsFilters
        filters={baseFilters}
        onChange={onChange}
        resultCount={12}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Cari nama produk atau SKU" }),
      { target: { value: "buket" } },
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "buket" }),
    );
  });

  it("shows the reset button only when filters are active", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ProductsFilters
        filters={baseFilters}
        onChange={onChange}
        resultCount={12}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();

    rerender(
      <ProductsFilters
        filters={{ ...baseFilters, category: "Buket" }}
        onChange={onChange}
        resultCount={4}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onChange).toHaveBeenCalledWith(DEFAULT_PRODUCT_FILTERS);
  });
});
