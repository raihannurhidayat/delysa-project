import type { SortingState } from "@tanstack/react-table";
import {
  ArrowUpDownIcon,
  FilterIcon,
  LayoutListIcon,
  Rows3Icon,
  SearchIcon,
  SlidersHorizontalIcon,
  Table2Icon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { ProductTable } from "../../lib/products/product-table-config";
import { TOGGLEABLE_COLUMN_LABELS } from "../../lib/products/product-table-config";
import {
  PRODUCT_CATEGORIES,
  type ProductFilters,
} from "../../lib/products/product.types";
import {
  PRODUCT_SORT_OPTIONS,
  sortKeyToState,
  sortStateToKey,
  type ProductSortKey,
} from "../../lib/products/product-sorting";
import { cn } from "cn";

export type TableDensity = "comfortable" | "compact";

export function ProductsToolbar({
  table,
  filters,
  onFiltersChange,
  sorting,
  onSortingChange,
  density,
  onDensityChange,
  showStatistics,
  onShowStatisticsChange,
}: {
  table: ProductTable;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
  showStatistics: boolean;
  onShowStatisticsChange: (show: boolean) => void;
}) {
  const sortKey = sortStateToKey(sorting);

  return (
    <div className="flex flex-col lg:justify-between gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        <SearchIcon
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
        />
        <Input
          type="search"
          aria-label="Cari nama produk atau SKU"
          placeholder="Cari nama produk, SKU…"
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          className="h-9 rounded-lg border-[#E5E7EB] bg-white pr-3 pl-9 text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
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
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
              />
            }
          >
            <Table2Icon size={14} aria-hidden="true" />
            {density === "compact" ? "Tampilan Rapat" : "Tampilan Tabel"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                Kepadatan baris
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={density}
                onValueChange={(value) =>
                  onDensityChange(value as TableDensity)
                }
              >
                <DropdownMenuRadioItem
                  value="comfortable"
                  className="rounded-lg text-xs"
                >
                  <LayoutListIcon size={14} aria-hidden="true" />
                  Nyaman
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="compact"
                  className="rounded-lg text-xs"
                >
                  <Rows3Icon size={14} aria-hidden="true" />
                  Rapat
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Filter kategori produk"
                className="h-9 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
              />
            }
          >
            <FilterIcon size={14} aria-hidden="true" />
            Filter
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                Kategori
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filters.category}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, category: String(value) })
                }
              >
                <DropdownMenuRadioItem
                  value="all"
                  className="rounded-lg text-xs"
                >
                  Semua Kategori
                </DropdownMenuRadioItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <DropdownMenuRadioItem
                    key={category}
                    value={category}
                    className="rounded-lg text-xs"
                  >
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Urutkan produk"
                className="h-9 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
              />
            }
          >
            <ArrowUpDownIcon size={14} aria-hidden="true" />
            Sort
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold tracking-wide text-[#9CA3AF] uppercase">
                Urutkan berdasarkan
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortKey}
                onValueChange={(value) =>
                  onSortingChange(sortKeyToState(value as ProductSortKey))
                }
              >
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="rounded-lg text-xs"
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          role="switch"
          aria-checked={showStatistics}
          aria-label="Tampilkan statistik"
          onClick={() => onShowStatisticsChange(!showStatistics)}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg px-1 text-xs font-semibold text-[#4B5563] sm:ml-0"
        >
          <span className="hidden sm:inline">Statistik</span>
          <span
            aria-hidden="true"
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              showStatistics ? "bg-[#FF6B35]" : "bg-[#D1D5DB]",
            )}
          >
            <span
              className={cn(
                "inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                showStatistics ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
