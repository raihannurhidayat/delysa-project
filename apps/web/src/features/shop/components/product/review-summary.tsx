import { Star } from "lucide-react";
import type { ProductDetail } from "~/features/shop/types";

/**
 * Ringkasan ulasan PDP: skor besar + distribusi bar 5→1 + box sentimen.
 */
export function ReviewSummary({ detail }: { detail: ProductDetail }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
      <div className="text-center lg:min-w-40">
        <p className="text-5xl font-extrabold tabular-nums text-[#1A1A1A]">
          {detail.rating.toFixed(1)}
        </p>
        <p
          className="mt-1 flex items-center justify-center gap-0.5"
          aria-label={`Rating ${detail.rating} dari 5`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              aria-hidden="true"
              className="fill-amber-400 text-amber-400"
            />
          ))}
        </p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Berdasarkan {detail.reviewCount} pesanan terkirim di Tasikmalaya
        </p>
      </div>
      <div
        className="flex flex-col gap-1.5"
        role="img"
        aria-label="Distribusi rating"
      >
        {detail.ratingBreakdown.map((b) => (
          <div key={b.stars} className="flex items-center gap-2 text-[11px]">
            <span className="w-10 shrink-0 text-[#6B7280]">
              {b.stars} Bintang
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
              <span
                className="block h-full rounded-full bg-[#111111]"
                style={{ width: `${b.pct}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right tabular-nums text-[#6B7280]">
              {b.pct}%
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-[#F8F9FA] p-3 text-[11px] leading-relaxed text-[#4B5563] lg:max-w-56">
        <p className="text-[11px] font-bold tracking-wide text-[#1A1A1A] uppercase">
          Ringkasan Sentimen
        </p>
        <ul className="mt-1 list-disc pl-4">
          <li>Bunga sangat segar & harum alami</li>
          <li>Pengiriman tepat waktu tiba di UNSIL</li>
          <li>Konfirmasi foto di WA ramah & teliti</li>
        </ul>
      </div>
    </div>
  );
}
