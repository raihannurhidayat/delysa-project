import { ShoppingCart, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR, formatSold } from "~/features/shop/lib/format";
import type { UnifiedProduct } from "~/features/shop/types";
import { cn } from "~/lib/utils";

export type CardProductVariant = "flash-sale" | "catalog" | "default";

/** Label tombol disamakan untuk semua varian (satu konstanta). */
const BUY_LABEL = "Beli Sekarang";

function stockStatus(left: number | undefined): {
  label: string;
  urgent: boolean;
} {
  if (left === undefined) return { label: "Tersedia", urgent: false };
  if (left <= 0) return { label: "Habis", urgent: true };
  if (left <= 3) return { label: "Segera Habis", urgent: true };
  return { label: "Tersedia", urgent: false };
}

/**
 * Satu kartu produk untuk semua jenis (fondasi gaya flash sale).
 * Diversifikasi via `variant`: badge, rating, harga, info stok.
 * Tombol beli disamakan untuk semua varian (UI-only tahap ini).
 */
export function CardProduct({
  item,
  variant,
}: {
  item: UnifiedProduct;
  variant: CardProductVariant;
}) {
  const left = item.stockLeft ?? item.stock;
  const { label: stockLabel, urgent } = stockStatus(left);
  const soldOut = left !== undefined && left <= 0;

  const progress =
    left !== undefined && item.stockTotal
      ? Math.min(Math.max(left / item.stockTotal, 0), 1) * 100
      : null;

  return (
    <article
      aria-label={item.name}
      className="group flex flex-col overflow-hidden rounded-xs border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
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
        {variant !== "default" ? (
          <p
            className={cn(
              "text-[10px] font-semibold tracking-[0.08em] uppercase",
              variant === "flash-sale" ? "text-[#6B7280]" : "text-emerald-700",
            )}
          >
            {item.category}
          </p>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-[#1A1A1A]">
          {variant === "default" ? (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`${item.name} (segera hadir)`}
              className="hover:text-[#FF6B35]"
            >
              {item.name}
            </a>
          ) : (
            item.name
          )}
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

        {variant === "flash-sale" && left !== undefined ? (
          <div className="mt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">Tersisa {left} item</span>
              <span
                className={cn(
                  "font-semibold",
                  urgent ? "text-[#DC2626]" : "text-[#059669]",
                )}
              >
                {stockLabel}
              </span>
            </div>
            {progress !== null ? (
              <div
                role="progressbar"
                aria-valuenow={left}
                aria-valuemin={0}
                aria-valuemax={item.stockTotal}
                aria-label={`Sisa stok ${item.name}: ${left} dari ${item.stockTotal}`}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F1F2F4]"
              >
                <div
                  aria-hidden="true"
                  style={{ width: `${progress}%` }}
                  className={cn(
                    "h-full rounded-full",
                    urgent
                      ? "bg-linear-to-r from-[#DC2626] to-[#F97316]"
                      : "bg-[#059669]",
                  )}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {variant === "catalog" &&
        item.stock !== undefined &&
        item.stock <= 5 ? (
          <p className="text-[11px] font-semibold text-[#DC2626]">
            Sisa {item.stock} item
          </p>
        ) : null}

        <Button
          type="button"
          size="sm"
          disabled={soldOut}
          onClick={() => window.alert("Beli segera hadir (UI-only)")}
          aria-label={`${item.name}: ${soldOut ? "stok habis" : "beli (segera hadir)"}`}
          className="mt-1 h-9 w-full rounded-xs cursor-pointer bg-[#111111] text-xs font-semibold text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ShoppingCart size={14} aria-hidden="true" />
          {soldOut ? "Stok Habis" : BUY_LABEL}
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
