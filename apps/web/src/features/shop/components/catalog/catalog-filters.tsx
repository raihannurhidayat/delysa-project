import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CATALOG_PRICE_PRESETS } from "~/features/shop/data/catalog";
import type { CatalogQuery } from "~/features/shop/types";
import { cn } from "~/lib/utils";

/**
 * Sidebar faset katalog: kategori (checkbox, single-select),
 * rentang harga (preset radio + min–max + terapkan). Faset adalah form:
 * fieldset + legend, count di dalam label, opsi zero-count memakai
 * aria-disabled (tetap fokusable).
 */
export function CatalogFilters({
  query,
  categories,
  counts,
  onCategory,
  onApplyPrice,
  onReset,
}: {
  query: CatalogQuery;
  categories: string[];
  counts: Record<string, number>;
  onCategory: (value: string | undefined) => void;
  onApplyPrice: (min?: number, max?: number) => void;
  onReset: () => void;
}) {
  const [minDraft, setMinDraft] = useState(query.minPrice?.toString() ?? "");
  const [maxDraft, setMaxDraft] = useState(query.maxPrice?.toString() ?? "");

  const applyCustom = () => {
    const min = minDraft.trim() === "" ? undefined : Number(minDraft);
    const max = maxDraft.trim() === "" ? undefined : Number(maxDraft);
    onApplyPrice(
      min !== undefined && Number.isFinite(min) && min >= 0 ? min : undefined,
      max !== undefined && Number.isFinite(max) && max >= 0 ? max : undefined,
    );
  };

  return (
    <aside
      aria-label="Filter produk"
      className="rounded-xl border border-[#E5E7EB] bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
          <SlidersHorizontal size={14} aria-hidden="true" />
          Filter Produk
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-semibold text-[#6B7280] underline-offset-4 hover:text-[#111111] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          Hapus filter
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className="text-[11px] font-bold tracking-wide text-[#1A1A1A] uppercase">
          Kategori rangkaian
        </legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {categories.map((category) => {
            const count = counts[category] ?? 0;
            const checked = query.category === category;
            return (
              <label
                key={category}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[13px] text-[#1A1A1A]",
                  "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-rose-600",
                  count === 0 && !checked && "text-[#9CA3AF]",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  aria-disabled={count === 0 && !checked}
                  onChange={() => onCategory(checked ? undefined : category)}
                  className="size-4 shrink-0 accent-rose-600"
                />
                <span className="flex-1">
                  {category}, {count} produk
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4 border-t border-[#F1F2F4] pt-4">
        <legend className="text-[11px] font-bold tracking-wide text-[#1A1A1A] uppercase">
          Rentang harga
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {CATALOG_PRICE_PRESETS.map((preset) => {
            const active =
              (query.minPrice ?? null) === (preset.min ?? null) &&
              (query.maxPrice ?? null) === (preset.max ?? null);
            return (
              <label
                key={preset.label}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium",
                  active
                    ? "border-[#111111] bg-[#111111] text-white"
                    : "border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#9CA3AF]",
                  "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-rose-600",
                )}
              >
                <input
                  type="radio"
                  name="catalog-price-preset"
                  checked={active}
                  onChange={() => onApplyPrice(preset.min, preset.max)}
                  className="sr-only"
                />
                {preset.label}
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Harga minimum"
            placeholder="Rp 0"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            className="h-9 text-xs"
          />
          <span aria-hidden="true" className="text-[#9CA3AF]">
            –
          </span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Harga maksimum"
            placeholder="Rp 100.000"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={applyCustom}
          className="mt-2 w-full rounded-lg"
        >
          Terapkan Filter Harga
        </Button>
      </fieldset>

      <div className="mt-4 rounded-xl bg-[#F8F9FA] p-3 text-[11px] leading-relaxed text-[#6B7280]">
        <p className="font-bold text-[#1A1A1A]">Jaminan Delysa Florist</p>
        <p>
          Buket difoto dan dikirim via WhatsApp pemesan sebelum dikirim oleh
          kurir internal Tasikmalaya.
        </p>
      </div>
    </aside>
  );
}
