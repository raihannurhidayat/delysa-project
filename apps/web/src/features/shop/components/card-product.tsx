import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { formatIDR, formatSold } from "~/features/shop/lib/format";
import type { UnifiedProduct } from "~/features/shop/types";
import { cn } from "~/lib/utils";

export type CardProductVariant = "flash-sale" | "catalog" | "default";

/**
 * Satu kartu produk untuk semua jenis (fondasi gaya flash sale).
 * Diversifikasi via `variant`: badge, rating, harga.
 * Seluruh kartu adalah link ke PDP `/products/$slug` (preload intent).
 */
export function CardProduct({
  item,
  variant,
}: {
  item: UnifiedProduct;
  variant: CardProductVariant;
}) {
  const left = item.stockLeft ?? item.stock;
  const soldOut = left !== undefined && left <= 0;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: item.slug }}
      aria-label={`Lihat detail ${item.name}`}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xs border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
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
        {variant === "flash-sale" && item.discountPercent ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#BE123C] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
            -{item.discountPercent}%
          </span>
        ) : null}
        {variant === "catalog" && item.badge ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#111111] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            {item.badge}
          </span>
        ) : null}
        {variant === "default" && item.isNew ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#111111] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            Baru
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p
          className={cn(
            "text-[10px] font-semibold tracking-[0.08em] uppercase",
            variant === "catalog" ? "text-emerald-700" : "text-[#6B7280]",
          )}
        >
          {item.category}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-[#1A1A1A]">
          {item.name}
        </h3>
        {variant !== "flash-sale" ? (
          <p className="flex items-center gap-1 text-[11px] text-[#6B7280]">
            <Star
              size={12}
              aria-hidden="true"
              className="fill-amber-400 text-amber-400"
            />
            <span className="font-semibold text-[#1A1A1A]">
              {item.rating.toFixed(1)}
            </span>
            {variant === "default" ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{formatSold(item.sold)} Terjual</span>
              </>
            ) : null}
          </p>
        ) : null}
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          {variant !== "default" && item.originalPrice ? (
            <s className="text-[11px] font-normal text-[#9CA3AF] tabular-nums">
              {formatIDR(item.originalPrice)}
            </s>
          ) : null}
          <span
            className={cn(
              "text-sm font-extrabold",
              variant === "flash-sale" && "text-[#DC2626]",
              variant === "catalog" && "text-[#1A1A1A]",
              variant === "default" && "font-bold text-[#FF6B35]",
            )}
          >
            {formatIDR(item.price)}
          </span>
        </p>

        {soldOut ? (
          <p className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-xs bg-[#F3F4F6] text-xs font-semibold text-[#9CA3AF]">
            Stok Habis
          </p>
        ) : null}
      </div>
    </Link>
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
