import { Star } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { formatIDR } from "~/features/shop/lib/format";
import type { ProductDetail } from "~/features/shop/types";

/**
 * Blok info PDP: eyebrow, rating, nama, harga + coret + hemat,
 * stok live, catatan termasuk. Harga sudah resolved varian.
 */
export function ProductInfo({
  detail,
  price,
}: {
  detail: ProductDetail;
  price: number;
}) {
  const discount =
    detail.originalPrice && detail.originalPrice > price
      ? Math.round((1 - price / detail.originalPrice) * 100)
      : detail.discountPercent;
  const inStock = detail.stock > 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6B7280] uppercase">
          Edisi Spesial Wisuda & Anniversary
        </p>
        <a
          href="#ulasan"
          className="flex shrink-0 items-center gap-1 text-[11px] text-[#6B7280] underline-offset-4 hover:text-[#1A1A1A] hover:underline"
          aria-label={`Lihat ${detail.reviewCount} ulasan, rating ${detail.rating.toFixed(1)} dari 5`}
        >
          <Star
            size={12}
            aria-hidden="true"
            className="fill-amber-400 text-amber-400"
          />
          <span className="font-bold text-[#1A1A1A]">
            {detail.rating.toFixed(1)}
          </span>
          <span>({detail.reviewCount} Ulasan)</span>
        </a>
      </div>
      <h1 className="mt-1 text-2xl leading-tight font-extrabold tracking-tight text-balance text-[#1A1A1A] sm:text-[28px]">
        {detail.name}
      </h1>
      <p className="mt-1 text-xs text-[#6B7280]">
        Premium Ecuadorian Roses, Dutch Hydrangea & Preserved Italian Eucalyptus
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl font-extrabold tabular-nums text-[#1A1A1A]">
          {formatIDR(price)}
        </span>
        {detail.originalPrice && detail.originalPrice > price ? (
          <>
            <s className="text-sm text-[#9CA3AF] tabular-nums">
              {formatIDR(detail.originalPrice)}
            </s>
            <Badge className="rounded-md bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-bold text-[#DC2626]">
              Hemat {discount}%
            </Badge>
          </>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] text-[#6B7280]">
        Sudah termasuk pita satin & box pelindung water-bag (Tanpa biaya
        tambahan)
      </p>
      <p
        className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
          inStock
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
        }`}
        role="status"
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${inStock ? "bg-emerald-500" : "bg-[#9CA3AF]"}`}
        />
        {inStock
          ? `Stok Tersedia: Sisa ${detail.stock} Buket Hari Ini — Tasikmalaya Studio`
          : "Stok Habis — hubungi atelier untuk pre-order"}
      </p>
    </div>
  );
}
