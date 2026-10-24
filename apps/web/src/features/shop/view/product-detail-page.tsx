import { Link } from "@tanstack/react-router";
import { Headset, RotateCcw, ShieldCheck, Truck, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { ProductCardSkeleton } from "~/features/shop/components/card-product";
import {
  GiftNoteField,
  GIFT_NOTE_MAX,
} from "~/features/shop/components/product/gift-note-field";
import { MiniCartDrawer } from "~/features/shop/components/product/mini-cart-drawer";
import { ProductGallery } from "~/features/shop/components/product/product-gallery";
import { ProductInfo } from "~/features/shop/components/product/product-info";
import { ProductTabs } from "~/features/shop/components/product/product-tabs";
import { PurchaseBar } from "~/features/shop/components/product/purchase-bar";
import { RelatedRail } from "~/features/shop/components/product/related-rail";
import { ReviewList } from "~/features/shop/components/product/review-list";
import { ReviewSummary } from "~/features/shop/components/product/review-summary";
import { VariantSelector } from "~/features/shop/components/product/variant-selector";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import { useProductDetail } from "~/features/shop/hooks/use-shop-queries";
import { formatIDR } from "~/features/shop/lib/format";
import {
  clampQty,
  resolveVariantPrice,
} from "~/features/shop/lib/product-detail";

/**
 * PDP `/products/$slug` penuh Image 1 (mock-only).
 * 5-state: loading skeleton, error + retry, success, disabled (stok-0),
 * slug-tak-ada ditangani `notFoundComponent` route (bukan di sini).
 */
export default function ProductDetailPage({ slug }: { slug: string }) {
  const { data, isPending, isError, refetch } = useProductDetail(slug);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [wrapId, setWrapId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const [stickyVisible, setStickyVisible] = useState(false);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const cart = useMiniCart();

  useEffect(() => {
    setSizeId(null);
    setWrapId(null);
    setQty(1);
    setNote("");
  }, [slug]);

  useEffect(() => {
    const el = purchaseRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPending, isError]);

  if (isPending) {
    return (
      <main
        className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"
        aria-label="Memuat detail produk"
      >
        <div className="h-4 w-48 animate-pulse rounded bg-[#E5E7EB]" />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-xl bg-[#E5E7EB]" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#E5E7EB]" />
            <ProductCardSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div
          role="alert"
          className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center"
        >
          <p className="text-base font-bold text-[#1A1A1A]">
            Gagal memuat produk
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Periksa koneksi lalu coba lagi.
          </p>
          <Button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  const size =
    data.sizes.find((s) => s.id === sizeId) ??
    data.sizes.find((s) => s.id === "grand-luxury") ??
    data.sizes[0];
  const wrap = data.wraps.find((w) => w.id === wrapId) ?? data.wraps[0];
  const price = resolveVariantPrice(data.price, size, wrap);
  const safeQty = clampQty(qty, data.stock);
  const soldOut = data.stock <= 0;

  const handleAdd = () => {
    if (soldOut || note.length > GIFT_NOTE_MAX) return;
    cart.add({
      slug: data.slug,
      name: data.name,
      image: data.gallery[0] ?? data.image,
      sizeId: size?.id ?? "standard",
      sizeLabel: size?.label ?? "Standard",
      wrapId: wrap?.id ?? "standard",
      wrapLabel: wrap?.label,
      price,
      qty: safeQty,
      note: note.trim() ? note.trim() : undefined,
      kind: "product",
      originalPrice: data.originalPrice,
      bonuses: data.bonuses,
      maxQty: data.stock,
    });
  };

  return (
    <main
      className="mx-auto max-w-7xl px-4 pt-4 pb-24 sm:px-6 lg:pb-8"
      aria-label={data.name}
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/katalog" />}>
              Shop
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-3 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          images={data.gallery}
          name={data.name}
          badges={
            <>
              <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-[#1A1A1A] shadow-sm">
                Tersedia Hari Ini (Same-Day)
              </span>
              {data.badge ? (
                <span className="w-fit rounded-md bg-[#111111] px-2 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                  {data.badge}
                </span>
              ) : null}
            </>
          }
        />
        <div className="flex flex-col gap-4">
          <ProductInfo detail={data} price={price} />
          <VariantSelector
            title="Pilihan Ukuran Rangkaian:"
            hint={
              size
                ? `${size.label}${size.stems ? ` (${size.stems})` : ""}`
                : undefined
            }
            options={data.sizes.map((s) => ({
              id: s.id,
              label: s.label,
              sub: s.stems,
              price: data.price + s.priceDelta,
            }))}
            value={size?.id ?? ""}
            onChange={setSizeId}
          />
          <VariantSelector
            title="Pilihan Kertas Wrapping:"
            options={data.wraps.map((w) => ({
              id: w.id,
              label: w.label,
              sub: w.sub,
            }))}
            value={wrap?.id ?? ""}
            onChange={setWrapId}
          />
          <GiftNoteField value={note} onChange={setNote} />
          <div ref={purchaseRef}>
            <PurchaseBar
              qty={safeQty}
              max={data.stock}
              price={price}
              onQty={setQty}
              onAdd={handleAdd}
              onBuyNow={handleAdd}
              wishlisted={cart.wishlist}
              onWishlist={() => cart.setWishlist((v: boolean) => !v)}
            />
          </div>
          <ul
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            aria-label="Jaminan belanja"
          >
            {[
              {
                icon: Truck,
                title: "Same-Day Tasikmalaya",
                sub: "Rangkaian tiba 2-3 jam",
              },
              {
                icon: ShieldCheck,
                title: "Garansi Segar 100%",
                sub: "Ganti jika layu saat terima",
              },
              {
                icon: Wallet,
                title: "Transfer BCA Resmi",
                sub: "Rekening a.n. Kartinah",
              },
              {
                icon: Headset,
                title: "Layanan CS Siaga",
                sub: "07.00 – 21.00 WIB setiap hari",
              },
            ].map((t) => (
              <li
                key={t.title}
                className="flex items-start gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F8F9FA] text-[#1A1A1A]">
                  <t.icon size={15} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold text-[#1A1A1A]">
                    {t.title}
                  </span>
                  <span className="block text-[11px] text-[#6B7280]">
                    {t.sub}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-[#E5E7EB] pt-6">
        <ProductTabs detail={data} />
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6B7280] uppercase">
          Ulasan Pelanggan Terverifikasi
        </p>
        <h2 className="text-xl font-extrabold tracking-tight text-[#1A1A1A]">
          Kepuasan & Bukti Rangkaian Nyata
        </h2>
        <div className="mt-3">
          <ReviewSummary detail={data} />
        </div>
        <div className="mt-4">
          <ReviewList reviews={data.reviews} />
        </div>
      </div>

      <RelatedRail category={data.category} currentSlug={data.slug} />

      <p className="mt-8 border-t border-[#E5E7EB] pt-3 text-[11px] text-[#6B7280]">
        Terakhir dilihat: &bull; {data.name} (Sedang Dilihat)
      </p>

      {stickyVisible && !soldOut ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#1A1A1A]">
                {data.name}
              </p>
              <p className="text-xs font-extrabold tabular-nums">
                {formatIDR(price)}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              className="h-10 rounded-lg bg-[#111111] text-xs font-bold text-white"
            >
              Tambah &bull; {formatIDR(price * safeQty)}
            </Button>
          </div>
        </div>
      ) : null}

      <MiniCartDrawer
        open={cart.isOpen}
        onOpenChange={cart.setOpen}
        lines={cart.lines}
        subtotal={cart.subtotal}
      />
    </main>
  );
}
