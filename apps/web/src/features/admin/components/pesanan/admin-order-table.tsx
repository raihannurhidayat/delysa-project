import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  PackageSearchIcon,
} from "lucide-react";
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

/** Kolom sekunder disembunyikan progresif agar tabel tetap proporsional di layar sempit. */
const RESPONSIVE_COLUMN_CLASS: Record<string, string> = {
  payment: "hidden lg:table-cell",
  age: "hidden md:table-cell",
  total: "hidden sm:table-cell",
};

const COLUMN_STYLES: Record<string, { th: string; td: string }> = {
  code: {
    th: "w-[170px] min-w-[155px] pl-4",
    td: "w-[170px] min-w-[155px] pl-4",
  },
  recipient: {
    th: "w-[210px] min-w-[190px]",
    td: "w-[210px] min-w-[190px]",
  },
  total: {
    th: "w-[185px] min-w-[165px]",
    td: "w-[185px] min-w-[165px]",
  },
  payment: {
    th: "w-[145px] min-w-[130px]",
    td: "w-[145px] min-w-[130px]",
  },
  age: {
    th: "w-[125px] min-w-[115px]",
    td: "w-[125px] min-w-[115px]",
  },
  status: {
    th: "w-[180px] min-w-[160px]",
    td: "w-[180px] min-w-[160px]",
  },
  action: {
    th: "w-[165px] min-w-[150px] pr-4 text-right",
    td: "w-[165px] min-w-[150px] pr-4 text-right",
  },
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
    <div className="min-w-0">
      {totalRows === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FFF3ED] text-[#C2410C]">
            <PackageSearchIcon size={24} aria-hidden="true" />
          </div>
          <p className="mt-2 text-sm font-bold text-[#1A1A1A]">
            {hasFilters ? "Tidak ada hasil yang cocok" : "Belum ada pesanan"}
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
        <Table className="w-full min-w-[720px] text-xs sm:text-sm lg:min-w-[1080px]">
          <TableHeader className="bg-[#F9FAFB]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#E5E7EB]">
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  const canSort = column.getCanSort();
                  const responsiveClass =
                    RESPONSIVE_COLUMN_CLASS[column.id] ?? "";
                  const style = COLUMN_STYLES[column.id];

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
                        "h-11 px-3 text-[11px] font-bold tracking-wider text-[#6B7280] uppercase select-none",
                        style?.th,
                        responsiveClass,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 rounded-sm text-left font-bold uppercase outline-none transition-colors hover:text-[#C2410C] focus-visible:ring-2 focus-visible:ring-[#FF6B35]/40"
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
                {row.getAllCells().map((cell) => {
                  const style = COLUMN_STYLES[cell.column.id];
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-3 py-3.5 align-middle",
                        style?.td,
                        RESPONSIVE_COLUMN_CLASS[cell.column.id] ?? "",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
