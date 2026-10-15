import { X } from "lucide-react";
import { formatIDR } from "~/features/shop/lib/format";
import type { CatalogQuery } from "~/features/shop/types";
import { cn } from "~/lib/utils";

function priceLabel(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined)
    return `${formatIDR(min)}–${formatIDR(max)}`;
  if (min !== undefined) return `Di atas ${formatIDR(min)}`;
  return `Di bawah ${formatIDR(max as number)}`;
}

/**
 * Bar "Filter aktif": satu chip per filter + reset semua.
 * Target sentuh ≥24px, label aksesibel per aksi hapus.
 */
export function ActiveFilterChips({
  query,
  onRemove,
  onResetAll,
}: {
  query: CatalogQuery;
  onRemove: (key: "search" | "category" | "price") => void;
  onResetAll: () => void;
}) {
  const chips: { key: "search" | "category" | "price"; label: string }[] = [];
  if (query.search)
    chips.push({ key: "search", label: `Cari: ${query.search}` });
  if (query.category)
    chips.push({ key: "category", label: `Kategori: ${query.category}` });
  if (query.minPrice !== undefined || query.maxPrice !== undefined)
    chips.push({
      key: "price",
      label: `Harga: ${priceLabel(query.minPrice, query.maxPrice)}`,
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xs border border-[#E5E7EB] bg-white px-3 py-2">
      <span className="text-[11px] font-bold tracking-wide text-[#6B7280] uppercase">
        Filter aktif:
      </span>
      {chips.length === 0 ? (
        <span className="text-xs text-[#9CA3AF]">Tidak ada filter.</span>
      ) : (
        chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex min-h-6 items-center gap-1 rounded-xs bg-[#F1F2F4] py-0.5 pr-1 pl-2.5 text-xs font-medium text-[#1A1A1A]"
          >
            {chip.label}
            <button
              type="button"
              onClick={() => onRemove(chip.key)}
              aria-label={`Hapus filter ${chip.label}`}
              className={cn(
                "flex size-6 items-center justify-center rounded-full cursor-pointer",
                "hover:bg-[#E5E7EB] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose-600",
              )}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))
      )}
      <button
        type="button"
        onClick={onResetAll}
        className="ml-auto shrink-0 text-[11px] font-bold tracking-wide text-[#6B7280] uppercase underline-offset-4 hover:text-[#111111] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
      >
        Reset semua filter
      </button>
    </div>
  );
}
