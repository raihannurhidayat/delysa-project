import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import type { Product } from "~/features/shop/types";
import { cn } from "~/lib/utils";

function stockStatus(stockLeft?: number): {
  label: string;
  urgent: boolean;
} {
  if (stockLeft === undefined) return { label: "Tersedia", urgent: false };
  if (stockLeft <= 0) return { label: "Habis", urgent: true };
  if (stockLeft <= 3) return { label: "Segera Habis", urgent: true };
  return { label: "Tersedia", urgent: false };
}

/**
 * Kartu produk khusus flash sale: badge diskon, wishlist,
 * harga coret, dan bar sisa stok seperti referensi desain.
 */
export function FlashSaleCard({ product }: { product: Product }) {
  const [wished, setWished] = useState(false);
  const { label: stockLabel, urgent } = stockStatus(product.stockLeft);
  const soldOut = (product.stockLeft ?? 1) <= 0;

  const progress =
    product.stockLeft !== undefined && product.stockTotal
      ? Math.min(Math.max(product.stockLeft / product.stockTotal, 0), 1) * 100
      : null;

  return (
    <article
      aria-label={product.name}
      className="group flex flex-col overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
    >
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
        {product.discountPercent ? (
          <span className="absolute top-2 left-2 rounded-md bg-[#BE123C] px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
            -{product.discountPercent}%
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setWished((v) => !v)}
          aria-pressed={wished}
          aria-label={
            wished
              ? `${product.name}: hapus dari wishlist`
              : `${product.name}: tambah ke wishlist`
          }
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE123C]"
        >
          <Heart
            size={16}
            aria-hidden="true"
            className={cn(
              wished ? "fill-[#BE123C] text-[#BE123C]" : "text-[#6B7280]",
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-[#6B7280] uppercase">
          {product.category}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-[#1A1A1A]">
          {product.name}
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-sm font-extrabold text-[#DC2626]">
            {formatIDR(product.price)}
          </span>
          {product.originalPrice ? (
            <s className="text-[11px] font-normal text-[#9CA3AF] tabular-nums">
              {formatIDR(product.originalPrice)}
            </s>
          ) : null}
        </p>

        {product.stockLeft !== undefined ? (
          <div className="mt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">
                Tersisa {product.stockLeft} item
              </span>
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
                aria-valuenow={product.stockLeft}
                aria-valuemin={0}
                aria-valuemax={product.stockTotal}
                aria-label={`Sisa stok ${product.name}: ${product.stockLeft} dari ${product.stockTotal}`}
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

        <Button
          type="button"
          size="sm"
          disabled={soldOut}
          onClick={() => window.alert("Beli Sekarang segera hadir (UI-only)")}
          aria-label={`${product.name}: beli sekarang (segera hadir)`}
          className="mt-2 h-9 w-full rounded-xs bg-[#111111] text-xs font-semibold text-white hover:bg-[#2A2A2A] disabled:opacity-50"
        >
          <ShoppingCart size={14} aria-hidden="true" />
          {soldOut ? "Stok Habis" : "Beli Sekarang"}
        </Button>
      </div>
    </article>
  );
}
