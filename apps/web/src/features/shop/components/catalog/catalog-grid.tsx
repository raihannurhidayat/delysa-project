import { SearchX } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  CardProduct,
  ProductCardSkeleton,
} from "~/features/shop/components/card-product";
import type { CatalogItem } from "~/features/shop/types";

/**
 * Grid hasil katalog: skeleton saat memuat, empty state + reset
 * saat tidak ada hasil, grid kartu saat sukses.
 */
export function CatalogGrid({
  items,
  isPending,
  onReset,
}: {
  items: CatalogItem[];
  isPending: boolean;
  onReset: () => void;
}) {
  if (isPending) {
    return (
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
        aria-label="Memuat produk katalog"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center"
      >
        <SearchX
          size={28}
          aria-hidden="true"
          className="mx-auto text-[#9CA3AF]"
        />
        <p className="mt-2 text-base font-bold text-[#1A1A1A]">
          Tidak ada hasil yang cocok
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Coba kata kunci lain atau reset semua filter.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="mt-4 rounded-full"
        >
          Reset semua filter
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <CardProduct key={item.id} item={item} variant="catalog" />
      ))}
    </div>
  );
}
