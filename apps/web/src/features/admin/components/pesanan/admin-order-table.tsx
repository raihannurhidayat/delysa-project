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
import type { AdminOrderTable } from "../../lib/pesanan/admin-order-table-config";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

/** Kolom sekunder disembunyikan progresif agar tabel tidak memicu scroll horizontal. */
const RESPONSIVE_COLUMN_CLASS: Record<string, string> = {
  payment: "hidden lg:table-cell",
  age: "hidden md:table-cell",
  total: "hidden sm:table-cell",
};

export function AdminOrderTable({
  table,
  hasFilters,
  onReset,
  onView,
  onReject,
}: {
  table: AdminOrderTable;
  hasFilters: boolean;
  onReset(): void;
  onView(order: AdminOrderView): void;
  onReject(order: AdminOrderView): void;
}) {
  const totalRows = table.getPrePaginatedRowModel().rows.length;

  return (
    <div className="min-w-0 rounded-3xl bg-white shadow-md ring-1 ring-foreground/5">
      {totalRows === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <p className="text-sm font-bold text-[#1A1A1A]">
            {hasFilters
              ? "Tidak ada hasil yang cocok"
              : "Belum ada pesanan"}
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-[#6B7280]">
            {hasFilters
              ? "Coba ubah kata kunci, tab status, periode, atau batch."
              : "Pesanan dari toko akan muncul di sini setelah pelanggan checkout."}
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
        <Table className="[&_td]:py-3 [&_th]:h-10">
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-[#F1F2F4] transition-colors hover:bg-[#FFFBF8]"
              >
                {row
                  .getAllCells()
                  .map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-2 align-top",
                        RESPONSIVE_COLUMN_CLASS[cell.column.id] ?? "",
                        cell.column.id === "action" && "pr-3 text-right",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
