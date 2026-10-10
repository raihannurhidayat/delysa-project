type SigninShowcaseProps = {
  imageSrc?: string;
  imageAlt: string;
};

export function SigninShowcase({ imageSrc, imageAlt }: SigninShowcaseProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#111111] text-[#FFFFFF]">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75"
      />

      <div className="absolute top-4 left-1/2 w-[min(420px,82%)] -translate-x-1/2 rounded-xl bg-[#FFFFFF]/95 p-3 text-[#1A1A1A] shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em]">
            CURATED ARTISAN BOUQUET
          </p>
          <span className="text-[11px] font-bold tracking-[0.12em] text-[#FF6B35]">
            LIMITED
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold">
          Handcrafted in Tasikmalaya Atelier
        </p>
        <p className="mt-1 text-xs text-[#4B5563]">
          <span aria-hidden="true" className="font-bold text-[#FF6B35]">
            ★★★★★
          </span>{" "}
          <span className="font-semibold text-[#1A1A1A]">4.9 / 5</span> (1.2k+
          Ulasan)
        </p>
      </div>

      <div className="absolute bottom-36 left-5 w-[min(380px,72%)] rounded-xl bg-[#FFFFFF]/95 p-3 text-[#1A1A1A] shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em]">
            INSTANT EXPRESS DELIVERY
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#15803D]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"
            />
            Siap Dirangkai
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563]">
          Same-day bouquet delivery siap antar hari ini sebelum pukul 18.00 WIB
          untuk area Tasikmalaya &amp; sekitarnya.
        </p>
      </div>

      <blockquote className="absolute right-5 bottom-5 left-5 border-l-2 border-white/40 pl-4">
        <p className="text-[13px] leading-snug text-white italic">
          “Mewujudkan setiap ungkapan kasih, kelulusan, dan momen bermakna
          dengan rangkaian flora berkualitas istimewa.”
        </p>
        <p className="mt-2 text-[11px] font-medium tracking-[0.14em] text-white/80 not-italic">
          DELYSA FLORAL ATELIER — EST. TASIKMALAYA
        </p>
      </blockquote>
    </div>
  );
}
