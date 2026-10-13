import { RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CategoryGrid } from "~/features/shop/components/storefront/category-grid";
import { FaqSection } from "~/features/shop/components/storefront/faq-section";
import { FlashSaleSection } from "~/features/shop/components/storefront/flash-sale-section";
import { HeroSection } from "~/features/shop/components/storefront/hero-section";
import { InstagramStrip } from "~/features/shop/components/storefront/instagram-strip";
import { ProductCardSkeleton } from "~/features/shop/components/card-product";
import { ProductRail } from "~/features/shop/components/storefront/product-rail";
import { PromoBanner } from "~/features/shop/components/storefront/promo-banner";
import { Testimonials } from "~/features/shop/components/storefront/testimonials";
import { TrustStrip } from "~/features/shop/components/storefront/trust-strip";
import {
  useBestSellersProducts,
  useCategoryProducts,
  useFlashSaleProducts,
  useNewArrivalsProducts,
  useProducts,
} from "~/features/shop/hooks/use-shop-queries";

export type StorefrontDemoState = "loading" | "empty" | "error";

function StorefrontLoading() {
  return (
    <main
      className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"
      aria-label="Memuat storefront"
    >
      <div className="h-[320px] animate-pulse rounded-2xl bg-[#E5E7EB]" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

function StorefrontError() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div
        role="alert"
        className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center"
      >
        <p className="text-base font-bold text-[#1A1A1A]">
          Gagal memuat storefront
        </p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Periksa koneksi lalu coba lagi.
        </p>
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    </main>
  );
}

export default function StorefrontPage({
  demo,
}: {
  demo?: StorefrontDemoState;
}) {
  const flash = useFlashSaleProducts();
  const best = useBestSellersProducts();
  const fresh = useNewArrivalsProducts();
  const wisuda = useCategoryProducts("Wisuda");
  const kado = useCategoryProducts("Kado");
  const reco = useProducts({ page: 1 });

  const pending = demo === "loading";

  if (demo === "loading") return <StorefrontLoading />;
  if (
    demo === "error" ||
    flash.isError ||
    best.isError ||
    fresh.isError ||
    wisuda.isError ||
    kado.isError ||
    reco.isError
  )
    return <StorefrontError />;

  const empty = demo === "empty";

  return (
    <main className="pb-4">
      <HeroSection />
      <CategoryGrid />
      <TrustStrip />
      <FlashSaleSection
        products={empty ? [] : (flash.data ?? [])}
        isPending={pending || flash.isPending}
      />
      <ProductRail
        eyebrow="Paling Laris"
        title="Produk Terlaris Minggu Ini"
        products={empty ? [] : (best.data ?? [])}
        isPending={pending || best.isPending}
        tabs={["Semua", "Wisuda", "Mawar", "Anggrek"]}
      />
      <ProductRail
        eyebrow="Baru Datang"
        title="Koleksi Terbaru Atelier"
        linkText="Lihat Semua Produk Terbaru"
        products={empty ? [] : (fresh.data ?? [])}
        isPending={pending || fresh.isPending}
      />
      <ProductRail
        eyebrow="Wisuda"
        title="Koleksi Wisuda Favorit"
        linkText="Lihat Semua (42 Produk)"
        products={empty ? [] : (wisuda.data ?? [])}
        isPending={pending || wisuda.isPending}
      />
      <ProductRail
        eyebrow="Kado"
        title="Buket Bunga Kado & Mawar Romantis"
        linkText="Lihat Semua (36 Produk)"
        products={empty ? [] : (kado.data ?? [])}
        isPending={pending || kado.isPending}
      />
      <PromoBanner />
      <ProductRail
        eyebrow="Untuk Anda"
        title="Rekomendasi Untuk Anda"
        products={empty ? [] : reco.items}
        isPending={pending || reco.isPending}
        loadMoreText="Muat Lebih Banyak Produk"
      />
      <Testimonials />
      <InstagramStrip />
      <FaqSection />
    </main>
  );
}
