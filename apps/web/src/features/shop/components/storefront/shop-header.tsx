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
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DELYSA_CONTACT } from "~/features/shop/data/storefront";
import { useSlidingIndicator } from "~/features/shop/hooks/use-sliding-indicator";
import { useSession } from "~/features/auth/hooks/use-session";
import { roleHome } from "~/features/auth/lib/role-home";
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
  { label: "Beranda", to: "/" },
  { label: "Semua Produk", to: "/katalog" },
  { label: "Terbaru", to: "/new-arrivals" },
  { label: "Terlaris", to: "/best-sellers" },
  { label: "Kategori", to: "/categories" },
  { label: "Promo", to: "/promo" },
  { label: "Pesanan Saya", to: "/riwayat-pesanan" },
  { label: "Tentang Kami", to: "/about" },
];

// Link menggabung className dasar + active/inactive (concat), jadi kelas
// varian hanya boleh ada di active/inactiveProps agar tidak konflik.
const NAV_BASE_CLASS =
  "inline-flex shrink-0 items-center rounded-lg px-3 py-2 text-[13.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]";
const NAV_ACTIVE_CLASS =
  "bg-[#FDF2F8] font-bold text-[#9D174D] ring-1 ring-[#F472B6]/60";
const NAV_IDLE_CLASS =
  "font-semibold text-[#292524] hover:bg-white hover:text-[#BE185D]";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const { count } = useMiniCart();
  const { user } = useSession();
  const accountTo = user ? roleHome(user.role) : "/sign-in";
  const accountName = user?.name.split(" ")[0];

  // Header persisten (tidak remount saat pindah route): tutup drawer manual.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchQuery.trim().slice(0, 100);
    if (pathname === "/katalog") {
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
    <header className="sticky top-0 z-40 border-b border-[#D6CBC6] bg-white shadow-[0_4px_14px_-8px_rgba(28,25,23,0.16)]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Button
          type="button"
          variant="outline"
          aria-label="Menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileNavOpen(true)}
          className="h-11 shrink-0 gap-1.5 rounded-xl border-[#C7BBB5] bg-white px-3 text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D] md:hidden"
        >
          <Menu size={20} aria-hidden="true" />
          <span className="text-sm font-semibold">Menu</span>
        </Button>

        <Link
          to="/"
          aria-label="Beranda Delysa Florist"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
        >
          <img
            src="/logo-delysa.jpg"
            alt=""
            width={42}
            height={42}
            className="size-10.5 shrink-0 rounded-full object-cover ring-1 ring-[#D6CBC6]"
          />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-[#1C1917] sm:text-base">
              DELYSA <span className="text-[#BE185D]">FLORIST</span>
            </span>
            <span className="mt-0.5 hidden text-[11px] font-medium text-[#57534E] sm:block">
              Tasikmalaya · Sejak 2016
            </span>
          </span>
        </Link>

        <form
          role="search"
          onSubmit={submitSearch}
          className="hidden flex-1 md:flex"
        >
          <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border-[1.5px] border-[#8C7E77] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.06)] transition-[border-color,box-shadow] focus-within:border-[#BE185D] focus-within:ring-3 focus-within:ring-[#BE185D]/20">
            <span
              aria-hidden="true"
              className="flex h-full shrink-0 items-center border-r border-[#D6CBC6] bg-[#FAF7F5] px-3.5 text-[#57534E]"
            >
              <Search size={17} />
            </span>
            <Input
              type="search"
              aria-label="Cari produk"
              placeholder="Cari buket wisuda, buket snack, mawar, papan bunga..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-full flex-1 rounded-none border-0 bg-transparent px-3.5 text-sm text-[#1C1917] placeholder:text-[#6B625C] focus-visible:border-0 focus-visible:ring-0"
            />
            <span
              aria-hidden="true"
              className="h-6 w-px shrink-0 bg-[#D6CBC6]"
            />
            <Button
              type="submit"
              className="h-full shrink-0 rounded-none bg-[#BE185D] px-5 text-sm font-semibold text-white hover:bg-[#9D174D]"
            >
              Cari
            </Button>
          </div>
        </form>

        <span
          aria-hidden="true"
          className="hidden h-7 w-px shrink-0 bg-[#D6CBC6] md:block"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <Link
            to="/keranjang"
            aria-label={`Keranjang, ${count} item`}
            className={buttonVariants({
              variant: "outline",
              className:
                "relative h-11 gap-2 rounded-xl border-[#C7BBB5] bg-[#FAF7F5] px-3 text-sm font-semibold text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D]",
            })}
          >
            <ShoppingCart size={19} aria-hidden="true" />
            <span className="hidden lg:inline">Keranjang</span>
            <Badge className="h-5 min-w-5 rounded-full bg-[#BE185D] px-1.5 text-[11px] font-bold text-white tabular-nums">
              {count}
            </Badge>
          </Link>

          <Link
            to={accountTo}
            aria-label={user ? "Buka akun" : "Masuk ke akun"}
            className={
              user
                ? buttonVariants({
                    variant: "outline",
                    className:
                      "h-11 gap-1.5 rounded-xl border-[#C7BBB5] bg-white px-3.5 text-sm font-semibold text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D]",
                  })
                : buttonVariants({
                    variant: "default",
                    className:
                      "h-11 gap-1.5 rounded-xl bg-[#BE185D] px-4 text-sm font-semibold text-white shadow-xs hover:bg-[#9D174D]",
                  })
            }
          >
            <User size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{accountName ?? "Masuk"}</span>
          </Link>
        </div>
      </div>

      {pathname !== "/katalog" ? (
        <div className="border-t border-[#EAE2DE] bg-[#FAF7F5] px-4 py-2.5 md:hidden">
          <form role="search" onSubmit={submitSearch}>
            <div className="flex h-11 w-full items-center overflow-hidden rounded-xl border-[1.5px] border-[#8C7E77] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.06)] transition-[border-color,box-shadow] focus-within:border-[#BE185D] focus-within:ring-3 focus-within:ring-[#BE185D]/20">
              <span
                aria-hidden="true"
                className="flex h-full shrink-0 items-center border-r border-[#D6CBC6] bg-[#FAF7F5] px-3 text-[#57534E]"
              >
                <Search size={16} />
              </span>
              <Input
                type="search"
                aria-label="Cari produk"
                placeholder="Cari buket wisuda, snack, mawar..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-full flex-1 rounded-none border-0 bg-transparent px-3 text-sm text-[#1C1917] placeholder:text-[#6B625C] focus-visible:border-0 focus-visible:ring-0"
              />
              <span
                aria-hidden="true"
                className="h-6 w-px shrink-0 bg-[#D6CBC6]"
              />
              <Button
                type="submit"
                className="h-full shrink-0 rounded-none bg-[#BE185D] px-4 text-xs font-semibold text-white hover:bg-[#9D174D]"
              >
                Cari
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <ShopMobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        links={NAV_LINKS}
        activeTo={activeTo}
      />

      <nav
        aria-label="Navigasi toko"
        className="hidden border-t border-[#E4D9D4] bg-[#FAF7F5] md:block"
      >
        <div
          ref={indicator.listRef}
          className="relative mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 whitespace-nowrap sm:px-6"
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
            className={`absolute bottom-0.5 left-0 h-[2.5px] rounded-full bg-[#BE185D] motion-reduce:transition-none ${
              indicator.ready
                ? "opacity-100 transition-[transform,width,opacity] duration-300 ease-out"
                : "opacity-0"
            }`}
          />
          <span className="ml-auto hidden items-center gap-3.5 border-l border-[#D6CBC6] pl-4 text-xs font-medium text-[#57534E] xl:flex">
            <a
              href={DELYSA_CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-[#BE185D]"
            >
              <MapPin size={13} aria-hidden="true" /> Tasikmalaya
            </a>
            <a
              href={`https://wa.me/${DELYSA_CONTACT.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-[#BE185D]"
            >
              <Phone size={13} aria-hidden="true" />{" "}
              {DELYSA_CONTACT.whatsappDisplay}
            </a>
            <a
              href={DELYSA_CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-[#BE185D]"
            >
              <AtSign size={13} aria-hidden="true" />{" "}
              {DELYSA_CONTACT.instagramHandle}
            </a>
          </span>
        </div>
      </nav>
    </header>
  );
}
