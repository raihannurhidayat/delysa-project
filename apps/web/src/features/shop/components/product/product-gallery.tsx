import { useState } from "react";
import { cn } from "~/lib/utils";

/**
 * Galeri PDP: gambar utama + thumbs button (bukan nested carousel —
 * YAGNI, satu indeks terpilih cukup; swipe mobile via scroll thumbs).
 * Gambar pertama `eager`, sisanya `lazy` (LCP).
 */
export function ProductGallery({
  images,
  name,
  badges,
}: {
  images: string[];
  name: string;
  badges?: React.ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const safe = Math.min(selected, images.length - 1);
  const current = images[safe] ?? images[0];

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
        {badges ? (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {badges}
          </div>
        ) : null}
        <img
          key={current}
          src={current}
          alt={`${name} — tampilan ${safe + 1} dari ${images.length}`}
          width={800}
          height={1000}
          loading="eager"
          decoding="async"
          className="aspect-[4/5] w-full object-cover"
        />
        <span className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          Foto Asli Atelier
        </span>
      </div>
      <div
        className="mt-2 grid grid-cols-5 gap-2"
        role="group"
        aria-label="Pilihan gambar produk"
      >
        {images.map((src, i) => {
          const active = i === safe;
          return (
            <button
              key={src + i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Lihat gambar ${i + 1} dari ${images.length}`}
              aria-pressed={active}
              aria-current={active}
              className={cn(
                "overflow-hidden rounded-lg border bg-[#F8F9FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600",
                active
                  ? "border-[#111111] ring-1 ring-[#111111]"
                  : "border-[#E5E7EB] hover:border-[#9CA3AF]",
              )}
            >
              <img
                src={src}
                alt=""
                width={200}
                height={250}
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
