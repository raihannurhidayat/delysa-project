import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { OrderHistorySearch } from "~/features/shop/schemas/order-history-search-schema";
import type { OrderPeriod, OrderSort } from "~/features/shop/types";

const PERIOD_OPTIONS: { value: OrderPeriod; label: string }[] = [
  { value: "30d", label: "30 hari" },
  { value: "90d", label: "90 hari" },
  { value: "1y", label: "1 tahun" },
  { value: "all", label: "Semua" },
];

const SORT_OPTIONS: { value: OrderSort; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "total_desc", label: "Total tertinggi" },
];

export function OrderHistoryToolbar({
  q,
  period,
  sort,
  resultCount,
  onChange,
}: {
  q?: string;
  period: OrderPeriod;
  sort: OrderSort;
  resultCount: number;
  onChange: (patch: Partial<OrderHistorySearch>) => void;
}) {
  const [draft, setDraft] = useState(q ?? "");

  useEffect(() => {
    setDraft(q ?? "");
  }, [q]);

  useEffect(() => {
    const id = setTimeout(() => {
      const normalized = draft.trim();
      if (normalized !== (q ?? "")) {
        onChange({ q: normalized || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [draft, onChange, q]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative w-full md:flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            aria-label="Cari pesanan"
            placeholder="Cari kode, nama penerima, atau item..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-10 rounded-lg border-[#E5E7EB] bg-white pr-4 pl-9 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={period}
            onValueChange={(value) => {
              if (!value) return;
              onChange({ period: value as OrderPeriod, page: 1 });
            }}
          >
            <SelectTrigger
              aria-label="Periode"
              className="h-10 flex-1 rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] md:w-36 md:flex-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-lg">
              {PERIOD_OPTIONS.map((option) => (
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

          <Select
            value={sort}
            onValueChange={(value) => {
              if (!value) return;
              onChange({ sort: value as OrderSort, page: 1 });
            }}
          >
            <SelectTrigger
              aria-label="Urutkan"
              className="h-10 flex-1 rounded-lg border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] md:w-40 md:flex-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-lg">
              {SORT_OPTIONS.map((option) => (
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
        </div>
      </div>

      <p aria-live="polite" className="text-xs text-[#6B7280]">
        {resultCount} pesanan ditemukan
      </p>
    </div>
  );
}
