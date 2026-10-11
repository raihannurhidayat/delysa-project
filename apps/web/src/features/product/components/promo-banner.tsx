import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { STOREFRONT_PRODUCTS } from "~/features/product/data/storefront";

export function PromoBanner() {
  return (
    <section
      aria-label="Pesan custom"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#111111] text-white">
        <img
          src={STOREFRONT_PRODUCTS[4].image}
          alt=""
          width={1600}
          height={500}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-white/70">
              RANGKAIAN KHUSUS TASIKMALAYA
            </p>
            <h2 className="mt-1 max-w-[24ch] text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              Koleksi Bunga Papan & Meja Ucapan Tasikmalaya
            </h2>
          </div>
          <Button
            type="button"
            onClick={() => window.alert("Pesan custom segera hadir (UI-only)")}
            className="shrink-0 rounded-full bg-white font-bold text-[#111111] hover:bg-[#F1F2F4]"
          >
            Pesan Custom
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
