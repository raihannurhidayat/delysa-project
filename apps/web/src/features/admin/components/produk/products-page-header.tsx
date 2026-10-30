import { DownloadIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { ProductTable } from "../../lib/products/product-table-config";
import { TOGGLEABLE_COLUMN_LABELS } from "../../lib/products/product-table-config";

export function ProductsPageHeader({
  table,
  onAdd,
  onExport,
}: {
  table: ProductTable;
  onAdd: () => void;
  onExport: () => void;
}) {
  const toggleableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#FF6B35] uppercase">
          Katalog &amp; Inventaris
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Produk
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          Kelola produk, pantau stok, dan atur tampilan katalog toko Anda.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
              />
            }
          >
            <SlidersHorizontalIcon size={14} aria-hidden="true" />
            Customize View
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                Kolom tabel
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {toggleableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={() => column.toggleVisibility()}
                  className="rounded-lg text-xs"
                >
                  {TOGGLEABLE_COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-10 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
        >
          <DownloadIcon size={14} aria-hidden="true" />
          Export
        </Button>

        <Button
          type="button"
          onClick={onAdd}
          className="h-10 gap-1.5 rounded-lg bg-[#FF6B35] px-4 text-xs font-semibold text-white hover:bg-[#C2410C]"
        >
          <PlusIcon size={15} aria-hidden="true" />
          Tambah Produk
        </Button>
      </div>
    </div>
  );
}
