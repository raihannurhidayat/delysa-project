import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import type { CatalogItem } from "~/features/shop/types";
import { cn } from "~/lib/utils";

/**
 * Kartu produk katalog: badge, wishlist, rating + jumlah ulasan,
 * harga coret, label "Sisa X" bila stok ≤ 5, tombol +Beli.
 */
export function CatalogCard({ item }: { item: CatalogItem }) {
  const [wished, setWished] = useState(false);
  const lowStock = item.stock <= 5;

  return (
    <article
      aria-label={item.name}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
    >
      <div className="relative overflow-hidden bg-[#F8F9FA]">
        <img
          src={item.image}
          alt={item.name}
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.badge ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#111111] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            {item.badge}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setWished((v) => !v)}
          aria-pressed={wished}
          aria-label={
            wished
              ? `${item.name}: hapus dari wishlist`
              : `${item.name}: tambah ke wishlist`
          }
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          <Heart
            size={16}
            aria-hidden="true"
            className={cn(
              wished ? "fill-rose-600 text-rose-600" : "text-[#6B7280]",
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-emerald-700 uppercase">
          {item.category}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-[#1A1A1A]">
          {item.name}
        </h3>
        <p className="flex items-center gap-1 text-[11px] text-[#6B7280]">
          <Star
            size={12}
            aria-hidden="true"
            className="fill-amber-400 text-amber-400"
          />
          <span className="font-semibold text-[#1A1A1A]">
            {item.rating.toFixed(1)}
          </span>
          <span>({item.reviewCount} ulasan)</span>
        </p>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          {item.originalPrice ? (
            <s className="text-[11px] font-normal text-[#9CA3AF] tabular-nums">
              {formatIDR(item.originalPrice)}
            </s>
          ) : null}
          <span className="text-sm font-extrabold text-[#1A1A1A]">
            {formatIDR(item.price)}
          </span>
        </p>
        {lowStock ? (
          <p className="text-[11px] font-semibold text-[#DC2626]">
            Sisa {item.stock} item
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={() => window.alert("Beli segera hadir (UI-only)")}
          aria-label={`${item.name}: beli (segera hadir)`}
          className="mt-1 h-9 w-full rounded-lg bg-[#111111] text-xs font-semibold text-white hover:bg-[#2A2A2A]"
        >
          <ShoppingCart size={14} aria-hidden="true" />
          +Beli
        </Button>
      </div>
    </article>
  );
}
