import { Zap } from "lucide-react";
import { FlashSaleCard } from "~/features/product/components/flash-sale-card";
import { ProductCardSkeleton } from "~/features/product/components/product-card";
import { endOfDay, useCountdown } from "~/features/product/hooks/use-countdown";
import type { Product } from "~/features/product/types";
import { cn } from "~/lib/utils";

function TimerDigit({
  value,
  urgent = false,
}: {
  value: string;
  urgent?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "min-w-9 rounded-xs px-1.5 py-1 text-center text-sm font-bold text-white tabular-nums",
        urgent ? "bg-[#DC2626]" : "bg-[#111111]",
      )}
    >
      {value}
    </span>
  );
}

function FlashSaleTimer() {
  const { hours, minutes, seconds } = useCountdown(endOfDay());

  return (
    <span className="flex items-center gap-2">
      <span className="text-[11px] font-bold tracking-wide text-[#6B7280] uppercase">
        Berakhir dalam:
      </span>
      <span
        role="timer"
        aria-label={`Flash sale berakhir dalam ${hours} jam ${minutes} menit ${seconds} detik`}
        className="flex items-center gap-1"
      >
        <TimerDigit value={hours} />
        <span aria-hidden="true" className="text-sm font-bold text-[#1A1A1A]">
          :
        </span>
        <TimerDigit value={minutes} />
        <span aria-hidden="true" className="text-sm font-bold text-[#1A1A1A]">
          :
        </span>
        <TimerDigit value={seconds} urgent />
      </span>
    </span>
  );
}

type FlashSaleSectionProps = {
  products: Product[];
  isPending?: boolean;
  linkText?: string;
};

/**
 * Section promo waktu terbatas dengan background khusus
 * (gradien rose → orange lembut) sebagai penanda urgensi,
 * mengikuti pola ProductRail namun visually distinct.
 */
export function FlashSaleSection({
  products,
  isPending = false,
  linkText = "Lihat Semua Promo",
}: FlashSaleSectionProps) {
  return (
    <section
      aria-label="Flash Sale Hari Ini"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-xs border border-[#FECDD3] bg-linear-to-br from-[#FFF1F2] via-[#FFF7ED] to-[#FFEDD5] p-4 sm:p-6">
        {/* Aksen dekoratif urgensi: lingkaran blur halus, murni dekoratif */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-[#FECDD3]/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-[#FED7AA]/50 blur-3xl"
        />

        <div className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xs bg-[#DC2626] text-white shadow-sm"
            >
              <Zap size={18} className="fill-white" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
                Flash Sale Hari Ini
              </h2>
              <p className="mt-0.5 text-xs text-[#6B7280] sm:text-[13px]">
                Penawaran kilat stok segar Tasikmalaya terbatas hari ini
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FlashSaleTimer />
            {linkText ? (
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-label={`${linkText} (segera hadir)`}
                className="shrink-0 text-xs font-semibold text-[#1A1A1A] underline-offset-4 hover:text-[#DC2626] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
              >
                {linkText}›
              </a>
            ) : null}
          </div>
        </div>

        <div className="relative">
          {isPending ? (
            <div
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
              aria-label="Memuat produk flash sale"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#FECDD3] bg-white/80 p-8 text-center text-sm text-[#6B7280]">
              Flash sale belum tersedia. Nantikan penawaran kilat berikutnya.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {products.map((product) => (
                <FlashSaleCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
