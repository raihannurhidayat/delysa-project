import {
  AtSign,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const NAV_LINKS = [
  "Home",
  "Shop Semua Produk",
  "New Arrivals",
  "Best Sellers",
  "Kategori Bunga",
  "Promo Spesial",
  "About",
];

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
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <DeadLink
          label="Beranda Delysa Florist"
          className="shrink-0 text-base font-extrabold tracking-tight text-[#111111]"
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.alert("Keranjang segera hadir (UI-only)")}
            aria-label="Keranjang, 0 item (segera hadir)"
            className="relative rounded-full"
          >
            <ShoppingCart size={20} aria-hidden="true" />
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-rose-600 px-1 text-[10px] text-white">
              0
            </Badge>
          </Button>
          <DeadLink label="Akun saya">
            <span className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted">
              <User size={20} aria-hidden="true" />
            </span>
          </DeadLink>
        </div>
      </div>
      <nav aria-label="Navigasi toko" className="border-t border-[#F1F2F4]">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2 text-[13px] font-medium whitespace-nowrap sm:px-6">
          {NAV_LINKS.map((label, i) => (
            <DeadLink
              key={label}
              label={label}
              className={
                i === 0
                  ? "font-bold text-[#111111]"
                  : "text-[#4B5563] hover:text-[#111111]"
              }
            >
              {label}
            </DeadLink>
          ))}
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
