import { AtSign } from "lucide-react";
import { SectionHeader } from "~/features/product/components/section-header";
import { STOREFRONT_PRODUCTS } from "~/features/product/data/storefront";

export function InstagramStrip() {
  const photos = STOREFRONT_PRODUCTS.slice(0, 5);

  return (
    <section
      aria-label="Koleksi Instagram"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
    >
      <SectionHeader
        eyebrow="@delysafloristt"
        title="Koleksi Harian Instagram"
        linkText="Follow @delysafloristt"
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {photos.map((photo) => (
          <li key={photo.id} className="overflow-hidden rounded-xl">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`Foto Instagram ${photo.name} (segera hadir)`}
              className="group block"
            >
              <img
                src={photo.image}
                alt=""
                width={600}
                height={600}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#6B7280]">
        <AtSign size={14} aria-hidden="true" />
        Tag @delysafloristt untuk tampil di sini
      </p>
    </section>
  );
}
