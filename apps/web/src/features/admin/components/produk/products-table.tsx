import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { ProductTable } from "../../lib/products/product-table-config";
import type { TableDensity } from "./products-toolbar";

/** Kolom sekunder disembunyikan progresif agar tabel tidak memicu scroll horizontal. */
const RESPONSIVE_COLUMN_CLASS: Record<string, string> = {
  category: "hidden xl:table-cell",
  price: "hidden sm:table-cell",
  sales: "hidden md:table-cell",
  revenue: "hidden xl:table-cell",
  rating: "hidden lg:table-cell",
  minThreshold: "hidden 2xl:table-cell",
  isPublished: "hidden 2xl:table-cell",
};

export function ProductsTable({
  table,
  density,
  hasFilters,
  onReset,
}: {
  table: ProductTable;
  density: TableDensity;
  hasFilters: boolean;
  onReset: () => void;
}) {
  const selectedCount = Object.keys(table.state.rowSelection).length;
  const totalRows = table.getPrePaginatedRowModel().rows.length;

  return (
    <div className="min-w-0">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FFE1D3] bg-[#FFF7F2] px-4 py-2">
          <p className="text-xs font-semibold text-[#C2410C]">
            {selectedCount} produk dipilih
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
            className="h-7 rounded-lg px-2 text-xs font-semibold text-[#C2410C] hover:bg-[#FFE1D3]"
          >
            Bersihkan pilihan
          </Button>
        </div>
      )}

      {totalRows === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {hasFilters
              ? "Tidak ada produk yang cocok dengan filter"
              : "Belum ada produk"}
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-[#6B7280]">
            {hasFilters
              ? "Coba ubah kata kunci, kategori, atau status stok."
              : "Tambahkan produk pertama melalui tombol “Tambah Produk”."}
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="mt-2 h-9 rounded-lg text-xs font-semibold"
            >
              Reset filter
            </Button>
          )}
        </div>
      ) : (
        <Table
          className={cn(
            "min-w-0 text-xs sm:text-sm",
            density === "compact"
              ? "[&_td]:py-1.5 [&_th]:h-9"
              : "[&_td]:py-3 [&_th]:h-10",
          )}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#E5E7EB]">
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  const canSort = column.getCanSort();
                  const responsiveClass =
                    RESPONSIVE_COLUMN_CLASS[column.id] ?? "";

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className={cn(
                        "px-2 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase",
                        responsiveClass,
                        column.id === "select" && "w-9 pl-3",
                        column.id === "action" && "w-10 pr-3 text-right",
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 rounded-sm text-left font-semibold uppercase outline-none hover:text-[#C2410C] focus-visible:ring-2 focus-visible:ring-[#FF6B35]/40"
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon
                              size={12}
                              aria-hidden="true"
                              className="text-[#C2410C]"
                            />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon
                              size={12}
                              aria-hidden="true"
                              className="text-[#C2410C]"
                            />
                          ) : (
                            <ArrowUpDownIcon
                              size={12}
                              aria-hidden="true"
                              className="text-[#C4C9D1]"
                            />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </tr>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const selected = row.getIsSelected();

              return (
                <TableRow
                  key={row.id}
                  data-selected={selected || undefined}
                  className={cn(
                    "border-b border-[#F1F2F4] transition-colors",
                    selected ? "bg-[#FFF7F2]" : "hover:bg-[#FFFBF8]",
                  )}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-2",
                        RESPONSIVE_COLUMN_CLASS[cell.column.id] ?? "",
                        cell.column.id === "select" && "pl-3",
                        cell.column.id === "action" && "pr-3 text-right",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
