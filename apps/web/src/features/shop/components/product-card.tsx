import { ShoppingBag, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import type { Product } from "~/features/shop/types";

function formatSold(sold: number): string {
  return sold >= 1000
    ? `${(sold / 1000).toFixed(1).replace(".", ",")}rb`
    : `${sold}`;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="relative overflow-hidden bg-[#F8F9FA]">
        <img
          src={product.image}
          alt={product.name}
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.isNew ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#111111] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            Baru
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="flex items-center gap-1 text-[11px] text-[#6B7280]">
          <Star
            size={12}
            aria-hidden="true"
            className="fill-amber-400 text-amber-400"
          />
          <span className="font-semibold text-[#1A1A1A]">
            {product.rating.toFixed(1)}
          </span>
          <span aria-hidden="true">•</span>
          <span>{formatSold(product.sold)} Terjual</span>
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-medium text-[#1A1A1A]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-label={`${product.name} (segera hadir)`}
            className="hover:text-[#FF6B35]"
          >
            {product.name}
          </a>
        </h3>
        <p className="text-sm font-bold text-[#FF6B35]">
          {formatIDR(product.price)}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => window.alert("Keranjang segera hadir (UI-only)")}
          aria-label={`${product.name}: tambah ke keranjang (segera hadir)`}
          className="mt-1 h-9 w-full rounded-lg bg-[#111111] text-xs font-semibold text-white hover:bg-[#2A2A2A]"
        >
          <ShoppingBag size={14} aria-hidden="true" />
          Keranjang
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
    >
      <div className="aspect-[4/5] w-full animate-pulse bg-[#E5E7EB]" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
    </div>
  );
}
