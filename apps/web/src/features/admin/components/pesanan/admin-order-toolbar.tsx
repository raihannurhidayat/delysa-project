import { RotateCcwIcon, SearchIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { AdminOrderFilters } from "../../lib/pesanan/admin-order.types";
import { DEFAULT_ADMIN_ORDER_FILTERS } from "../../lib/pesanan/admin-order-filters";

const PERIOD_OPTIONS: { value: AdminOrderFilters["period"]; label: string }[] =
  [
    { value: "all", label: "Semua Tanggal" },
    { value: "today", label: "Hari Ini" },
    { value: "7d", label: "7 Hari Terakhir" },
  ];

const BATCH_OPTIONS: { value: AdminOrderFilters["batch"]; label: string }[] = [
  { value: "all", label: "Semua Batch" },
  { value: "unsil", label: "Batch Wisuda UNSIL" },
];

export function AdminOrderToolbar({
  filters,
  onChange,
  resultCount,
  onReset,
}: {
  filters: AdminOrderFilters;
  onChange(next: AdminOrderFilters): void;
  resultCount: number;
  onReset(): void;
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xs">
        <SearchIcon
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
        />
        <Input
          type="search"
          aria-label="Cari no. order, produk, atau nama pelanggan"
          placeholder="Cari no. order, produk, atau nama pelanggan…"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          className="h-9 rounded-lg border-[#E5E7EB] bg-white pr-3 pl-9 text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.period}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...filters,
                period: value as AdminOrderFilters["period"],
              });
            }
          }}
        >
          <SelectTrigger
            id="admin-order-period"
            aria-label="Periode pesanan"
            className="h-9 w-44 rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#4B5563]"
          >
            <SelectValue>
              {(value) =>
                PERIOD_OPTIONS.find((option) => option.value === value)
                  ?.label ?? PERIOD_OPTIONS[0].label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="rounded-lg text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.batch}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...filters,
                batch: value as AdminOrderFilters["batch"],
              });
            }
          }}
        >
          <SelectTrigger
            id="admin-order-batch"
            aria-label="Batch pesanan"
            className="h-9 w-48 rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#4B5563]"
          >
            <SelectValue>
              {(value) =>
                BATCH_OPTIONS.find((option) => option.value === value)?.label ??
                BATCH_OPTIONS[0].label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {BATCH_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="rounded-lg text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={
            JSON.stringify(filters) ===
            JSON.stringify(DEFAULT_ADMIN_ORDER_FILTERS)
          }
          className="h-9 gap-1.5 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#4B5563]"
        >
          <RotateCcwIcon size={13} aria-hidden="true" />
          Reset
        </Button>
      </div>

      <p
        aria-live="polite"
        className="text-xs font-medium text-[#6B7280] lg:ml-auto"
      >
        Menampilkan {resultCount} pesanan
      </p>
    </div>
  );
}
