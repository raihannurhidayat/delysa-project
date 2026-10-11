import { RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CategoryGrid } from "~/features/product/components/category-grid";
import { CountdownTimer } from "~/features/product/components/countdown-timer";
import { FaqSection } from "~/features/product/components/faq-section";
import { HeroSection } from "~/features/product/components/hero-section";
import { InstagramStrip } from "~/features/product/components/instagram-strip";
import { ProductCardSkeleton } from "~/features/product/components/product-card";
import { ProductRail } from "~/features/product/components/product-rail";
import { PromoBanner } from "~/features/product/components/promo-banner";
import { ShopFooter } from "~/features/product/components/shop-footer";
import { ShopHeader } from "~/features/product/components/shop-header";
import { Testimonials } from "~/features/product/components/testimonials";
import { TrustStrip } from "~/features/product/components/trust-strip";
import { useStorefrontData } from "~/features/product/hooks/use-storefront-data";

export type StorefrontDemoState = "loading" | "empty" | "error";

function StorefrontLoading() {
  return (
    <>
      <ShopHeader />
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
      <ShopFooter />
    </>
  );
}

function StorefrontError() {
  return (
    <>
      <ShopHeader />
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
      <ShopFooter />
    </>
  );
}

export default function StorefrontPage({
  demo,
}: {
  demo?: StorefrontDemoState;
}) {
  const { products } = useStorefrontData();

  if (demo === "loading") return <StorefrontLoading />;
  if (demo === "error") return <StorefrontError />;

  const list = demo === "empty" ? [] : products;
  const byCategory = (category: string) =>
    list.filter((p) => p.category === category);

  return (
    <>
      <ShopHeader />
      <main className="pb-4">
        <HeroSection />
        <CategoryGrid />
        <TrustStrip />
        <ProductRail
          eyebrow="Promo"
          title="Flash Sale Hari Ini"
          linkText="Lihat Semua Promo"
          products={list.slice(0, 4)}
          timer={<CountdownTimer />}
        />
        <ProductRail
          eyebrow="Paling Laris"
          title="Produk Terlaris Minggu Ini"
          products={list}
          tabs={["Semua", "Wisuda", "Mawar", "Anggrek"]}
        />
        <ProductRail
          eyebrow="Baru Datang"
          title="Koleksi Terbaru Atelier"
          linkText="Lihat Semua Produk Terbaru"
          products={[...list].filter((p) => p.isNew)}
        />
        <ProductRail
          eyebrow="Wisuda"
          title="Koleksi Wisuda Favorit"
          linkText="Lihat Semua (42 Produk)"
          products={byCategory("Wisuda")}
        />
        <ProductRail
          eyebrow="Kado"
          title="Buket Bunga Kado & Mawar Romantis"
          linkText="Lihat Semua (36 Produk)"
          products={byCategory("Kado")}
        />
        <PromoBanner />
        <ProductRail
          eyebrow="Untuk Anda"
          title="Rekomendasi Untuk Anda"
          products={list}
          loadMoreText="Muat Lebih Banyak Produk"
        />
        <Testimonials />
        <InstagramStrip />
        <FaqSection />
      </main>
      <ShopFooter />
    </>
  );
}
