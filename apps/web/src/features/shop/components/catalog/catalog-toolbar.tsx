import { useEffect, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { CatalogQuery, CatalogSortKey } from "~/features/shop/types";

const SORT_OPTIONS: { value: CatalogSortKey; label: string }[] = [
  { value: "termurah", label: "Harga: Termurah ke Termahal" },
  { value: "termahal", label: "Harga: Termahal ke Termurah" },
  { value: "terbaru", label: "Paling Baru" },
];

/**
 * Toolbar katalog: search (debounce 300ms), select kategori cepat,
 * select sort, dan hitungan hasil (aria-live). Tanpa import router —
 * semua perubahan diteruskan via callback.
 */
export function CatalogToolbar({
  query,
  categories,
  counts,
  onSearch,
  onCategory,
  onSort,
  resultCount,
}: {
  query: CatalogQuery;
  categories: string[];
  counts: Record<string, number>;
  onSearch: (value: string) => void;
  onCategory: (value: string | undefined) => void;
  onSort: (value: CatalogSortKey | undefined) => void;
  resultCount: number;
}) {
  const [draft, setDraft] = useState(query.search ?? "");

  useEffect(() => {
    setDraft(query.search ?? "");
  }, [query.search]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (draft.trim() !== (query.search ?? "")) onSearch(draft.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [draft]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-32 flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            aria-label="Filter nama buket"
            placeholder="Filter nama buket…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 rounded-xs border-[#E5E7EB] bg-white pr-4 pl-9 text-sm"
          />
        </div>
        <Label className="gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Kategori:
          <Select
            value={query.category ?? null}
            onValueChange={(value) => onCategory(value ?? undefined)}
          >
            <SelectTrigger
              aria-label="Filter kategori cepat"
              className="h-10 min-w-52 rounded-xs border-[#E5E7EB] bg-white px-3 text-xs font-medium normal-case text-[#1A1A1A]"
            >
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xs">
              <SelectItem className="rounded-xs text-xs">Semua</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="rounded-xs text-xs">
                  {c} ({counts[c] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
        <Label className="gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Urutkan:
          <Select
            value={query.sort ?? null}
            onValueChange={(value) => onSort(value ?? undefined)}
          >
            <SelectTrigger
              aria-label="Urutkan produk"
              className="h-10 min-w-52 rounded-xs border-[#E5E7EB] bg-white px-3 text-xs font-medium normal-case text-[#1A1A1A]"
            >
              <SelectValue placeholder="Paling Relevan" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xs">
              <SelectItem className="rounded-xs text-xs">
                Paling Relevan
              </SelectItem>
              {SORT_OPTIONS.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="rounded-xs text-xs"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>
      <p aria-live="polite" className="text-xs text-[#6B7280]">
        Menampilkan{" "}
        <span className="font-bold text-[#1A1A1A]">{resultCount}</span> produk
        buket &amp; rangkaian
      </p>
    </div>
  );
}
