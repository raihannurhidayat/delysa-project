import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MOCK_PRODUCTS } from "../../lib/products/mock-products";
import { ProductsStatsCards } from "./products-stats-cards";

describe("ProductsStatsCards", () => {
  it("renders totals, revenue, sold units, and stock warnings from mock data", () => {
    render(<ProductsStatsCards products={MOCK_PRODUCTS} />);

    expect(screen.getByText("Total Produk")).toBeInTheDocument();
    expect(screen.getByText("9 tayang publik di web")).toBeInTheDocument();
    expect(screen.getByText("Pendapatan Produk")).toBeInTheDocument();
    expect(screen.getByText("Produk Terjual")).toBeInTheDocument();
    expect(screen.getByText("Peringatan Stok")).toBeInTheDocument();
    expect(screen.getByText("2 habis · 4 menipis")).toBeInTheDocument();
  });
});
