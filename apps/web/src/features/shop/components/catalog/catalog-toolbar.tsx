import { useEffect, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
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
        <div className="relative min-w-44 flex-1">
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
            className="h-10 rounded-full border-[#E5E7EB] bg-white pr-4 pl-9 text-sm"
          />
        </div>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Kategori:
          <select
            aria-label="Filter kategori cepat"
            value={query.category ?? ""}
            onChange={(e) => onCategory(e.target.value || undefined)}
            className="h-10 rounded-full border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] normal-case focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({counts[c] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Urutkan:
          <select
            aria-label="Urutkan produk"
            value={query.sort ?? ""}
            onChange={(e) =>
              onSort(
                (e.target.value || undefined) as CatalogSortKey | undefined,
              )
            }
            className="h-10 rounded-full border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1A1A1A] normal-case focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <option value="">Paling Relevan</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <span
          aria-hidden="true"
          className="ml-auto hidden items-center gap-1 text-[#9CA3AF] sm:flex"
        >
          <LayoutGrid size={16} />
        </span>
      </div>
      <p aria-live="polite" className="text-xs text-[#6B7280]">
        Menampilkan{" "}
        <span className="font-bold text-[#1A1A1A]">{resultCount}</span> produk
        buket &amp; rangkaian
      </p>
    </div>
  );
}
