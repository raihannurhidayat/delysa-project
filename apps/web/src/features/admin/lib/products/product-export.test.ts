import { describe, expect, it } from "vitest";
import { MOCK_PRODUCTS } from "./mock-products";
import { productsToCsv } from "./product-export";
import { summarizeProducts } from "./product-filters";
import type { AdminProduct } from "./product.types";

const BASE: AdminProduct = {
  id: 1,
  name: "Buket Uji",
  sku: "DF-UJI-001",
  category: "Buket",
  price: 100000,
  stock: 4,
  stockUnit: "Buket",
  minThreshold: 5,
  sales: 10,
  rating: 4.5,
  isPublished: true,
};

describe("productsToCsv", () => {
  it("writes headers, derived revenue, and stock labels", () => {
    const csv = productsToCsv([BASE]);
    const [header, row] = csv.split("\r\n");

    expect(header).toContain("Pendapatan");
    expect(row).toContain("Buket Uji");
    expect(row).toContain("1000000"); // 100000 × 10
    expect(row).toContain("Menipis");
    expect(row).toContain("Aktif di Web");
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = productsToCsv([
      { ...BASE, name: 'Buket "Spesial", Ukuran\nBesar' },
    ]);
    const row = csv.split("\r\n")[1];

    expect(row).toContain('"Buket ""Spesial"", Ukuran\nBesar"');
  });

  it("serializes every mock product", () => {
    const csv = productsToCsv(MOCK_PRODUCTS);
    expect(csv.split("\r\n")).toHaveLength(MOCK_PRODUCTS.length + 1);
  });
});

describe("summarizeProducts", () => {
  it("sums stock states, sales, and revenue", () => {
    const summary = summarizeProducts(MOCK_PRODUCTS);

    expect(summary.total).toBe(12);
    expect(summary.outOfStock).toBe(2);
    expect(summary.inStock).toBe(10);
    expect(summary.lowStock).toBe(4);
    expect(summary.published).toBe(9);
    expect(summary.totalSales).toBe(
      MOCK_PRODUCTS.reduce((total, product) => total + product.sales, 0),
    );
    expect(summary.revenue).toBe(
      MOCK_PRODUCTS.reduce(
        (total, product) => total + product.price * product.sales,
        0,
      ),
    );
  });
});
