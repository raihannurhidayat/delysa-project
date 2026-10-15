import { Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Clock,
  Flower2,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { ActiveFilterChips } from "~/features/shop/components/catalog/active-filter-chips";
import { CatalogFilters } from "~/features/shop/components/catalog/catalog-filters";
import { CatalogGrid } from "~/features/shop/components/catalog/catalog-grid";
import { CatalogPagination } from "~/features/shop/components/catalog/catalog-pagination";
import { CatalogToolbar } from "~/features/shop/components/catalog/catalog-toolbar";
import { CATALOG_CATEGORIES } from "~/features/shop/data/catalog";
import { useProducts } from "~/features/shop/hooks/use-shop-queries";
import type { CatalogSearch } from "~/features/shop/schemas/catalog-query-schema";
import { CATALOG_PAGE_SIZE } from "~/features/shop/types";

const TRUST_ITEMS = [
  {
    icon: Clock,
    title: "BUKA 07.00–21.00 WIB",
    subtitle: "Respons chat cepat & siap terima pesanan dadakan.",
  },
  {
    icon: Truck,
    title: "BEBAS ONGKIR TASIKMALAYA",
    subtitle: "Gratis pengiriman area kota, min. belanja Rp200.000.",
  },
  {
    icon: ShieldCheck,
    title: "TRANSFER RESMI BCA",
    subtitle: "Pembayaran aman a.n. Kartinah.",
  },
  {
    icon: Camera,
    title: "FOTO SEBELUM KIRIM",
    subtitle: "Pratinjau via WhatsApp sebelum kurir jalan.",
  },
];

/**
 * Halaman katalog /katalog. Query param adalah state (baca via prop dari
 * route, tulis via navigate functional updater + reset page ke 1).
 */
export default function CatalogPage({ query }: { query: CatalogSearch }) {
  const navigate = useNavigate({ from: "/katalog" });
  const { items, total, counts, isPending, isError } = useProducts(query);
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  // Diverifikasi via context7: TanStack Router docs "Scroll Restoration >
  // Preventing Scroll Restoration" — navigate({ resetScroll: false })
  // mempertahankan posisi scroll. Dipakai untuk semua perubahan filter agar
  // pengguna yang sedang scroll di grid tidak tiba-tiba loncat ke atas.
  // Navigasi pagination (onPage) sengaja dibiarkan default agar scroll ke atas.
  const update = (patch: Record<string, string | number | undefined>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch, page: 1 }),
      resetScroll: false,
    });
  };
  const resetAll = () => {
    void navigate({ search: {}, resetScroll: false });
  };

  if (query.demo === "error" || isError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div
          role="alert"
          className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center"
        >
          <p className="text-base font-bold text-[#1A1A1A]">
            Gagal memuat katalog
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Periksa koneksi lalu coba lagi.
          </p>
          <Button
            type="button"
            onClick={resetAll}
            className="mt-4 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  const visibleItems = query.demo === "empty" ? [] : items;
  const loading = query.demo === "loading" || isPending;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-4 sm:px-6" aria-label="Katalog">
      <Breadcrumb className="pt-4">
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
            <BreadcrumbPage>Katalog</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
            Katalog Rangkaian Bunga &amp; Buket Delysa
          </h1>
          <p className="mt-0.5 text-xs text-[#6B7280] sm:text-[13px]">
            Menampilkan {total} hasil kurasi buket &amp; rangkaian segar siap
            kirim di Tasikmalaya
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { icon: Truck, label: "Pengiriman Cepat Tasikmalaya" },
            { icon: Flower2, label: "Bunga Segar Terawat" },
          ].map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1A1A1A]"
            >
              <chip.icon
                size={12}
                aria-hidden="true"
                className="text-emerald-700"
              />
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <ActiveFilterChips
          query={query}
          onRemove={(key) => {
            if (key === "search") update({ search: undefined });
            else if (key === "category") update({ category: undefined });
            else update({ minPrice: undefined, maxPrice: undefined });
          }}
          onResetAll={resetAll}
        />
      </div>

      <div className="mt-3">
        <CatalogToolbar
          query={query}
          categories={CATALOG_CATEGORIES}
          counts={counts}
          onSearch={(value) => update({ search: value || undefined })}
          onCategory={(value) => update({ category: value })}
          onSort={(value) => update({ sort: value })}
          resultCount={total}
        />
      </div>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-60">
          <CatalogFilters
            query={query}
            categories={CATALOG_CATEGORIES}
            counts={counts}
            onCategory={(value) => update({ category: value })}
            onApplyPrice={(min, max) =>
              update({ minPrice: min, maxPrice: max })
            }
            onReset={resetAll}
          />
        </div>
        <div className="min-w-0 flex-1">
          <CatalogGrid
            items={visibleItems}
            isPending={loading}
            onReset={resetAll}
          />
          <div className="mt-4">
            <CatalogPagination
              page={query.page}
              pageCount={pageCount}
              total={total}
              pageSize={CATALOG_PAGE_SIZE}
              onPage={(p) => {
                void navigate({
                  search: (prev) => ({ ...prev, page: p }),
                });
              }}
            />
          </div>
        </div>
      </div>

      <section aria-label="Jaminan belanja" className="mt-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <item.icon size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-bold text-[#1A1A1A]">
                  {item.title}
                </span>
                <span className="block text-[11px] text-[#6B7280]">
                  {item.subtitle}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
