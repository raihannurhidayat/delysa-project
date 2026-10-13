import { useStorefrontData } from "~/features/shop/hooks/use-storefront-data";

export function CategoryGrid() {
  const { categories } = useStorefrontData();

  return (
    <section
      aria-label="Kategori pilihan cepat"
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-[#1A1A1A]">
          Kategori Pilihan Cepat
        </h2>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label="Lihat semua kategori (segera hadir)"
          className="text-xs font-medium text-[#6B7280] hover:text-[#111111]"
        >
          Lihat Semua Kategori
        </a>
      </div>
      <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {categories.map((category) => (
          <li key={category.id}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`Kategori ${category.name}, ${category.count} produk (segera hadir)`}
              className="group flex flex-col items-center gap-1.5"
            >
              <span className="h-14 w-14 overflow-hidden rounded-full ring-1 ring-[#E5E7EB] group-hover:ring-2 group-hover:ring-[#FF6B35] sm:h-16 sm:w-16">
                <img
                  src={category.image}
                  alt=""
                  width={400}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="text-center text-[11px] leading-tight font-medium text-[#1A1A1A]">
                {category.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
