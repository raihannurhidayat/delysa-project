type SignupShowcaseProps = {
  imageSrc?: string;
  imageAlt: string;
};

export function SignupShowcase({ imageSrc, imageAlt }: SignupShowcaseProps) {
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

      <div className="absolute top-4 left-1/2 w-[min(420px,82%)] -translate-x-1/2 rounded-xl bg-[#FFFFFF]/95 p-3.5 text-[#1C1917] shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-[#57534E]">
            RANGKAIAN SEGAR HARIAN
          </p>
          <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-[11px] font-bold text-[#9D174D]">
            SEJAK 2016
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold">
          Dirangkai Langsung di Toko Delysa Florist
        </p>
        <p className="mt-1 text-xs text-[#57534E]">
          <span aria-hidden="true" className="font-bold text-amber-500">
            ★★★★★
          </span>{" "}
          <span className="font-semibold text-[#1C1917]">4.9 / 5</span> · Buket
          Wisuda, Jajanan, Uang &amp; Papan Bunga
        </p>
      </div>

      <div className="absolute bottom-36 left-5 w-[min(380px,72%)] rounded-xl bg-[#FFFFFF]/95 p-3.5 text-[#1C1917] shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-[#57534E]">
            KIRIM HARI YANG SAMA
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-600"
            />
            07.00–21.00 WIB
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#57534E]">
          Melayani pengantaran area Tasikmalaya &amp; sekitarnya dari Jl.
          Pancasila Lengkongsari, Cikalang, Tawang.
        </p>
      </div>

      <blockquote className="absolute right-5 bottom-5 left-5 border-l-2 border-[#FBCFE8] pl-4">
        <p className="text-[13px] leading-snug text-white italic">
          “Mewujudkan setiap ungkapan kasih, kelulusan, dan momen bermakna
          dengan rangkaian bunga &amp; buket terbaik.”
        </p>
        <p className="mt-2 text-[11px] font-medium tracking-[0.12em] text-white/85 not-italic">
          DELYSA FLORIST — TASIKMALAYA SEJAK 2016
        </p>
      </blockquote>
    </div>
  );
}
