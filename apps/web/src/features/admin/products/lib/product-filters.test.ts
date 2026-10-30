import { describe, expect, it } from "vitest";
import { filterProducts, formatRupiah, getStockStatus, paginate } from "./product-filters";
import { MOCK_PRODUCTS } from "./mock-products";
import type { AdminProduct } from "./product.types";

function product(overrides: Partial<AdminProduct>): AdminProduct {
  return {
    id: 1,
    name: "Produk Uji",
    sku: "DF-TEST-001",
    category: "Buket",
    price: 100000,
    stock: 10,
    stockUnit: "Buket",
    minThreshold: 5,
    isPublished: true,
    ...overrides,
  };
}

describe("getStockStatus", () => {
  it("classifies aman, menipis, and habis", () => {
    expect(getStockStatus(product({ stock: 10, minThreshold: 5 }))).toBe("aman");
    expect(getStockStatus(product({ stock: 5, minThreshold: 5 }))).toBe("menipis");
    expect(getStockStatus(product({ stock: 0, minThreshold: 5 }))).toBe("habis");
  });
});

describe("filterProducts", () => {
  it("filters by case-insensitive search across name, sku, and category", () => {
    const result = filterProducts(MOCK_PRODUCTS, {
      search: "df-brid",
      category: "all",
      stockStatus: "all",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.sku).toBe("DF-BRID-210");
  });

  it("filters by category", () => {
    const result = filterProducts(MOCK_PRODUCTS, {
      search: "",
      category: "Standing Flower",
      stockStatus: "all",
    });
    expect(result).toHaveLength(3);
  });

  it("filters by stock status habis", () => {
    const result = filterProducts(MOCK_PRODUCTS, {
      search: "",
      category: "all",
      stockStatus: "habis",
    });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.stock === 0)).toBe(true);
  });

  it("filters by stock status menipis", () => {
    const result = filterProducts(MOCK_PRODUCTS, {
      search: "",
      category: "all",
      stockStatus: "menipis",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.stock > 0 && p.stock <= p.minThreshold)).toBe(
      true,
    );
  });

  it("returns everything for default filters", () => {
    const result = filterProducts(MOCK_PRODUCTS, {
      search: "   ",
      category: "all",
      stockStatus: "all",
    });
    expect(result).toHaveLength(MOCK_PRODUCTS.length);
  });
});

describe("paginate", () => {
  it("slices the requested page and reports totals", () => {
    const result = paginate(MOCK_PRODUCTS, 2, 8);
    expect(result.rows).toHaveLength(4);
    expect(result.total).toBe(12);
    expect(result.totalPages).toBe(2);
  });

  it("clamps out-of-range pages", () => {
    const result = paginate(MOCK_PRODUCTS, 99, 8);
    expect(result.rows).toHaveLength(4);
    expect(paginate([], 3, 8).totalPages).toBe(1);
  });
});

describe("formatRupiah", () => {
  it("formats IDR without decimals", () => {
    expect(formatRupiah(500000)).toContain("500.000");
  });
});
