import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProductFormDialog, type ProductFormValues } from "../components/product-form-dialog";
import { ProductsFilters } from "../components/products-filters";
import { ProductsPagination } from "../components/products-pagination";
import { ProductsStatsCards } from "../components/products-stats-cards";
import { ProductsTable } from "../components/products-table";
import { filterProducts, paginate } from "../lib/product-filters";
import {
  DEFAULT_PRODUCT_FILTERS,
  type AdminProduct,
  type ProductFilters,
} from "../lib/product.types";
import { MOCK_PRODUCTS } from "../lib/mock-products";

const PER_PAGE = 8;

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(MOCK_PRODUCTS);
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
  const pageData = useMemo(
    () => paginate(filtered, page, PER_PAGE),
    [filtered, page],
  );

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.stockStatus !== "all";

  function handleFiltersChange(next: ProductFilters) {
    setFilters(next);
    setPage(1);
  }

  function openCreate() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingProduct(product);
    setDialogOpen(true);
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
      setPage(1);
    }
    setDialogOpen(false);
    setEditingProduct(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#FF6B35] uppercase">
            Katalog &amp; Inventaris
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Katalog Produk
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
            Kelola portofolio buket bunga, pantau stok, dan atur tampilan katalog
            di halaman pelanggan.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="h-11 shrink-0 gap-1.5 rounded-lg bg-[#FF6B35] px-4 text-sm font-semibold text-white hover:bg-[#C2410C]"
        >
          <PlusIcon size={16} aria-hidden="true" />
          Tambah Produk
        </Button>
      </div>

      <ProductsStatsCards products={products} />

      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] p-4">
          <ProductsFilters
            filters={filters}
            onChange={handleFiltersChange}
            resultCount={filtered.length}
          />
        </div>
        <ProductsTable
          products={pageData.rows}
          hasFilters={hasFilters}
          onEdit={openEdit}
          onReset={() => handleFiltersChange({ ...DEFAULT_PRODUCT_FILTERS })}
        />
        <ProductsPagination
          page={page}
          totalPages={pageData.totalPages}
          totalItems={pageData.total}
          perPage={PER_PAGE}
          onPageChange={setPage}
        />
      </div>

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
