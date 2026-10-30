import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { ProductTable } from "../../lib/products/product-table-config";

function buildPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(current - 2, total - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function ProductsPagination({ table }: { table: ProductTable }) {
  const { pageIndex, pageSize } = table.state.pagination;
  const totalItems = table.getPrePaginatedRowModel().rows.length;
  const totalPages = table.getPageCount();

  if (totalPages <= 1) return null;

  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <nav
      aria-label="Navigasi halaman produk"
      className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E7EB] px-4 py-3 sm:flex-row"
    >
      <p className="text-xs text-[#6B7280]">
        Menampilkan {start}–{end} dari {totalItems} produk
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          aria-label="Halaman sebelumnya"
          className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold"
        >
          <ChevronLeftIcon size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        {buildPageNumbers(pageIndex, totalPages).map((index) => (
          <Button
            key={index}
            type="button"
            variant={index === pageIndex ? "default" : "outline"}
            size="sm"
            onClick={() => table.setPageIndex(index)}
            aria-label={`Halaman ${index + 1}`}
            aria-current={index === pageIndex ? "page" : undefined}
            className="h-8 min-w-8 rounded-lg px-2 text-xs font-semibold"
          >
            {index + 1}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          aria-label="Halaman berikutnya"
          className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
