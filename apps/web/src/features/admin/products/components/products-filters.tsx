import { RotateCcwIcon, SearchIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DEFAULT_PRODUCT_FILTERS,
  PRODUCT_CATEGORIES,
  type ProductFilters,
  type ProductStockFilter,
} from "../lib/product.types";

const STOCK_STATUS_OPTIONS: { value: ProductStockFilter; label: string }[] = [
  { value: "all", label: "Semua Status Stok" },
  { value: "aman", label: "Aman" },
  { value: "menipis", label: "Menipis" },
  { value: "habis", label: "Habis" },
];

export function ProductsFilters({
  filters,
  onChange,
  resultCount,
}: {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  resultCount: number;
}) {
  const isFiltered =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.stockStatus !== "all";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="relative w-full md:w-auto md:min-w-56 md:max-w-sm md:flex-1">
          <SearchIcon
            size={16}
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            aria-label="Cari nama produk atau SKU"
            placeholder="Cari nama produk, SKU…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-10 rounded-lg border-[#E5E7EB] bg-white pr-4 pl-9 text-sm"
          />
        </div>

        <Label className="w-full flex-col items-stretch gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase md:w-auto md:flex-row md:items-center">
          Kategori:
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({ ...filters, category: (value ?? "all") as string })
            }
          >
            <SelectTrigger
              aria-label="Filter kategori produk"
              className="h-10 w-full rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-medium normal-case text-[#1A1A1A] md:w-auto md:min-w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-lg">
              <SelectItem className="rounded-md text-xs">Semua Kategori</SelectItem>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="rounded-md text-xs"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>

        <Label className="w-full flex-col items-stretch gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase md:w-auto md:flex-row md:items-center">
          Status Stok:
          <Select
            value={filters.stockStatus}
            onValueChange={(value) =>
              onChange({
                ...filters,
                stockStatus: (value ?? "all") as ProductStockFilter,
              })
            }
          >
            <SelectTrigger
              aria-label="Filter status stok"
              className="h-10 w-full rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-medium normal-case text-[#1A1A1A] md:w-auto md:min-w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-lg">
              {STOCK_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-md text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange({ ...DEFAULT_PRODUCT_FILTERS })}
            className="h-10 justify-start gap-1.5 px-3 text-xs font-semibold text-[#6B7280] md:ml-auto"
          >
            <RotateCcwIcon size={14} aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>
      <p aria-live="polite" className="text-xs text-[#6B7280]">
        Menampilkan <span className="font-bold text-[#1A1A1A]">{resultCount}</span>{" "}
        produk
      </p>
    </div>
  );
}
