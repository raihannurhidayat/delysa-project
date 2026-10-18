import { Link } from "@tanstack/react-router";
import {
  CardProduct,
  ProductCardSkeleton,
} from "~/features/shop/components/card-product";
import {
  useCategoryProducts,
  useProducts,
} from "~/features/shop/hooks/use-shop-queries";

/**
 * Produk terkait PDP: 4 kartu se-kategori (tanpa produk saat ini),
 * fallback rekomendasi umum. Reuse `CardProduct variant="default"`.
 */
export function RelatedRail({
  category,
  currentSlug,
}: {
  category: string;
  currentSlug: string;
}) {
  const byCat = useCategoryProducts(category);
  const reco = useProducts({ page: 1 });
  const pending = byCat.isPending || reco.isPending;

  const pool =
    (byCat.data ?? []).filter((p) => p.slug !== currentSlug).length > 0
      ? (byCat.data ?? []).filter((p) => p.slug !== currentSlug)
      : reco.items.filter((p) => p.slug !== currentSlug);
  const items = pool.slice(0, 4);

  return (
    <section aria-label="Produk terkait" className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6B7280] uppercase">
            Koleksi Terkait
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-[#1A1A1A]">
            Lengkapi Momen Spesial Anda
          </h2>
        </div>
        <Link
          to="/katalog"
          className="shrink-0 text-xs font-semibold text-[#1A1A1A] underline-offset-4 hover:underline"
        >
          Lihat Semua Koleksi Wisuda →
        </Link>
      </div>
      {pending ? (
        <div
          className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4"
          aria-label="Memuat produk terkait"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F8F9FA] p-8 text-center text-sm text-[#6B7280]">
          Belum ada rekomendasi untuk kategori ini.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((p) => (
            <CardProduct key={p.id} item={p} variant="default" />
          ))}
        </div>
      )}
    </section>
  );
}
