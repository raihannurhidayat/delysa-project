import { useCallback, useMemo, useState } from "react";
import { useTable, type SortingState } from "@tanstack/react-table";
import { ProductsPageHeader } from "../components/produk/products-page-header";
import { ProductsPagination } from "../components/produk/products-pagination";
import { ProductsStatsCards } from "../components/produk/products-stats-cards";
import { ProductsStockTabs } from "../components/produk/products-stock-tabs";
import { ProductsTable } from "../components/produk/products-table";
import {
  ProductsToolbar,
  type TableDensity,
} from "../components/produk/products-toolbar";
import {
  ProductFormDialog,
  type ProductFormValues,
} from "../components/produk/product-form-dialog";
import { createProductColumns } from "../components/produk/product-columns";
import {
  filterProducts,
  summarizeProducts,
} from "../lib/products/product-filters";
import { downloadProductsCsv } from "../lib/products/product-export";
import {
  PRODUCT_PAGE_SIZE,
  productTableFeatures,
} from "../lib/products/product-table-config";
import {
  DEFAULT_PRODUCT_FILTERS,
  type AdminProduct,
  type ProductFilters,
} from "../lib/products/product.types";
import { MOCK_PRODUCTS } from "../lib/products/mock-products";

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(MOCK_PRODUCTS);
  const [filters, setFilters] = useState<ProductFilters>(
    DEFAULT_PRODUCT_FILTERS,
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [density, setDensity] = useState<TableDensity>("comfortable");
  const [showStatistics, setShowStatistics] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  const openCreate = useCallback(() => {
    setEditingProduct(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((product: AdminProduct) => {
    setEditingProduct(product);
    setDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createProductColumns({ onEdit: openEdit }),
    [openEdit],
  );
  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [products, filters],
  );
  const categoryScopedProducts = useMemo(
    () => filterProducts(products, { ...filters, stockStatus: "all" }),
    [products, filters],
  );
  const tabSummary = useMemo(
    () => summarizeProducts(categoryScopedProducts),
    [categoryScopedProducts],
  );

  const table = useTable({
    features: productTableFeatures,
    columns,
    data: filteredProducts,
    initialState: {
      pagination: { pageIndex: 0, pageSize: PRODUCT_PAGE_SIZE },
    },
  });

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.stockStatus !== "all";

  function handleFiltersChange(next: ProductFilters) {
    setFilters(next);
    table.setPageIndex(0);
  }

  function handleResetFilters() {
    handleFiltersChange({ ...DEFAULT_PRODUCT_FILTERS });
  }

  function handleSortingChange(next: SortingState) {
    setSorting(next);
    table.setSorting(next);
    table.setPageIndex(0);
  }

  function handleExport() {
    const rows = table
      .getPrePaginatedRowModel()
      .rows.map((row) => row.original);
    downloadProductsCsv(rows);
  }

  function handleSubmit(values: ProductFormValues) {
    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id
            ? { ...product, ...values, imageUrl: values.imageUrl || undefined }
            : product,
        ),
      );
    } else {
      setProducts((current) => [
        {
          ...values,
          id: Math.max(0, ...current.map((product) => product.id)) + 1,
          imageUrl: values.imageUrl || undefined,
        },
        ...current,
      ]);
      table.setPageIndex(0);
    }
    setDialogOpen(false);
    setEditingProduct(null);
  }

  return (
    <div className="min-w-0 space-y-4">
      <ProductsPageHeader onAdd={openCreate} onExport={handleExport} />

      {showStatistics && <ProductsStatsCards products={products} />}

      <section
        aria-label="Daftar produk"
        className="min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="border-b border-[#E5E7EB] px-3 py-3 sm:px-4">
          <ProductsStockTabs
            value={filters.stockStatus}
            counts={{
              all: tabSummary.total,
              aman: tabSummary.inStock - tabSummary.lowStock,
              habis: tabSummary.outOfStock,
              menipis: tabSummary.lowStock,
            }}
            onChange={(stockStatus) =>
              handleFiltersChange({ ...filters, stockStatus })
            }
          />
        </div>

        <div className="border-b border-[#E5E7EB] px-3 py-3 sm:px-4">
          <ProductsToolbar
            table={table}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            density={density}
            onDensityChange={setDensity}
            showStatistics={showStatistics}
            onShowStatisticsChange={setShowStatistics}
          />
        </div>

        <ProductsTable
          table={table}
          density={density}
          hasFilters={hasFilters}
          onReset={handleResetFilters}
        />
        <ProductsPagination table={table} />
      </section>

      <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        Data katalog pada iterasi ini masih berupa contoh (mock) dan belum
        tersimpan ke server. Integrasi API produk akan mengikuti.
      </p>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
