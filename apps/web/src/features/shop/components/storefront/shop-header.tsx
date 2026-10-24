import {
  AtSign,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useSlidingIndicator } from "~/features/shop/hooks/use-sliding-indicator";
import { useDemoAuth } from "~/features/shop/hooks/use-demo-auth";
import { DEMO_CUSTOMER_NAME } from "~/features/shop/lib/demo-auth-store";
import { ShopMobileNav } from "./shop-mobile-nav";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";

export type ShopNavTo =
  | "/"
  | "/katalog"
  | "/new-arrivals"
  | "/best-sellers"
  | "/categories"
  | "/promo"
  | "/riwayat-pesanan"
  | "/about";

export type ShopNavItem = {
  label: string;
  to: ShopNavTo;
};

export const NAV_LINKS: ShopNavItem[] = [
  { label: "Home", to: "/" },
  { label: "Shop Semua Produk", to: "/katalog" },
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "Best Sellers", to: "/best-sellers" },
  { label: "Kategori Bunga", to: "/categories" },
  { label: "Promo Spesial", to: "/promo" },
  { label: "Pesanan Saya", to: "/riwayat-pesanan" },
  { label: "About", to: "/about" },
];

// Link menggabung className dasar + active/inactive (concat), jadi kelas
// varian hanya boleh ada di active/inactiveProps agar tidak konflik.
const NAV_BASE_CLASS =
  "shrink-0 transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600";
const NAV_ACTIVE_CLASS = "font-bold text-[#111111]";
const NAV_IDLE_CLASS = "font-medium text-[#4B5563] hover:text-[#111111]";

function DeadLink({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={`${label} (segera hadir)`}
      className={className}
    >
      {children}
    </a>
  );
}

export function ShopHeader() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  const activeTo: ShopNavTo | null = NAV_LINKS.some(
    (item) => item.to === pathname,
  )
    ? (pathname as ShopNavTo)
    : null;
  const indicator = useSlidingIndicator({ value: activeTo });
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [mobileSearch, setMobileSearch] = React.useState("");
  const { count } = useMiniCart();
  const { isCustomer } = useDemoAuth();

  // Header persisten (tidak remount saat pindah route): tutup drawer manual.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const submitMobileSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Batas 100 char mengikuti skema zod search katalog
    // (catalog-query-schema.ts) agar tak pernah mengirim nilai tak valid.
    const value = mobileSearch.trim().slice(0, 100);
    if (pathname === "/katalog") {
      // Di katalog: perlakukan seperti filter agar scroll tidak loncat
      // (pola resetScroll:false di catalog-page.tsx). `to` membuat updater
      // `search` terketik terhadap skema katalog (terverifikasi context7:
      // TanStack Router "Navigate and update search params with useNavigate").
      void navigate({
        to: "/katalog",
        search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
        resetScroll: false,
      });
    } else {
      void navigate({
        to: "/katalog",
        search: value ? { search: value } : {},
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          aria-label="Menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileNavOpen(true)}
          className="h-11 shrink-0 gap-1.5 rounded-full px-3 text-[#111111] md:hidden"
        >
          <Menu size={20} aria-hidden="true" />
          <span className="text-sm font-semibold">Menu</span>
        </Button>
        <DeadLink
          label="Beranda Delysa Florist"
          className="hidden shrink-0 text-base font-extrabold tracking-tight text-[#111111] md:block"
        >
          DELYSA FLORIST
        </DeadLink>
        <div className="relative hidden flex-1 md:block">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            aria-label="Cari produk"
            placeholder="Cari buket wisuda, papan bunga, mawar..."
            className="h-10 rounded-full border-[#E5E7EB] bg-[#F8F9FA] pr-4 pl-9 text-sm"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Link to="/keranjang" className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Keranjang, ${count} item`}
              className="relative rounded-full"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-rose-600 px-1 text-[10px] text-white">
                {count}
              </Badge>
            </Button>
          </Link>
          <Link
            to="/riwayat-pesanan"
            aria-label="Riwayat pesanan"
            className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:bg-muted"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full">
              <User size={20} aria-hidden="true" />
            </span>
            {isCustomer ? (
              <span className="hidden pr-2 text-xs font-semibold text-[#111111] sm:inline">
                {DEMO_CUSTOMER_NAME.split(" ")[0]}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <form role="search" onSubmit={submitMobileSearch} className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            aria-label="Cari produk"
            placeholder="Cari buket wisuda, papan bunga, mawar..."
            value={mobileSearch}
            onChange={(event) => setMobileSearch(event.target.value)}
            className="h-11 rounded-full border-[#E5E7EB] bg-[#F8F9FA] pr-4 pl-9 text-sm"
          />
        </form>
      </div>
      <ShopMobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        links={NAV_LINKS}
        activeTo={activeTo}
      />
      <nav
        aria-label="Navigasi toko"
        className="hidden border-t border-[#F1F2F4] md:block"
      >
        <div
          ref={indicator.listRef}
          className="relative mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2 text-[13px] font-medium whitespace-nowrap sm:px-6"
        >
          {NAV_LINKS.map((item) => (
            <span
              key={item.label}
              ref={indicator.itemRef(item.to === activeTo)}
              className="shrink-0"
            >
              <Link
                to={item.to}
                activeOptions={{ exact: true, includeSearch: false }}
                // aria-current="page" + data-status="active" otomatis dari Link.
                activeProps={{
                  className: NAV_ACTIVE_CLASS,
                }}
                inactiveProps={{
                  className: NAV_IDLE_CLASS,
                }}
                className={NAV_BASE_CLASS}
              >
                {item.label}
              </Link>
            </span>
          ))}
          <span
            aria-hidden="true"
            style={indicator.style}
            // Transisi hanya dipasang setelah pengukuran pertama agar mount
            // awal snap ke posisi (tidak slide dari kiri); navigasi berikut
            // beranimasi dua arah dari posisi aktif terakhir.
            className={`absolute bottom-1 left-0 h-[2px] rounded-full bg-rose-600 motion-reduce:transition-none ${
              indicator.ready
                ? "opacity-100 transition-[transform,width,opacity] duration-300 ease-out"
                : "opacity-0"
            }`}
          />
          <span className="ml-auto hidden items-center gap-4 text-xs text-[#6B7280] lg:flex">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" /> Tasikmalaya
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone size={12} aria-hidden="true" /> 0824 9904 9999
            </span>
            <span className="inline-flex items-center gap-1">
              <AtSign size={12} aria-hidden="true" /> @delysafloristt
            </span>
          </span>
        </div>
      </nav>
    </header>
  );
}
