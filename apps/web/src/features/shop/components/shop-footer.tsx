import { STOREFRONT_FOOTER } from "~/features/shop/data/storefront";

const SHOP_LINKS = [
  "Buket Wisuda & Graduation",
  "Buket Mawar & Rose",
  "Bunga Tangan & Hand Bouquet",
  "Bunga Papan & Standing",
  "Bunga Meja & Dekorasi",
  "Promo Flash Sale Hari Ini",
];

const HELP_LINKS = [
  "Bantuan Pengiriman",
  "Cara Pesan & Deposit",
  "Konfirmasi Ongkir Tasikmalaya",
  "Syarat & Ketentuan",
  "Kebijakan Privasi",
  "Hubungi Kami",
];

function FooterLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={`${label} (segera hadir)`}
      className="text-[13px] text-[#9CA3AF] hover:text-white"
    >
      {label}
    </a>
  );
}

export function ShopFooter() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-extrabold tracking-tight">
            DELYSA FLORIST
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9CA3AF]">
            {STOREFRONT_FOOTER.address}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#9CA3AF]">
            {STOREFRONT_FOOTER.hours}
          </p>
        </div>
        <nav aria-label="Kategori belanja">
          <p className="text-xs font-bold tracking-wider text-white">
            KATEGORI BELANJA
          </p>
          <ul className="mt-3 space-y-2">
            {SHOP_LINKS.map((label) => (
              <li key={label}>
                <FooterLink label={label} />
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Layanan pelanggan">
          <p className="text-xs font-bold tracking-wider text-white">
            LAYANAN PELANGGAN
          </p>
          <ul className="mt-3 space-y-2">
            {HELP_LINKS.map((label) => (
              <li key={label}>
                <FooterLink label={label} />
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-bold tracking-wider text-white">
            PEMBAYARAN RESMI
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#9CA3AF]">
            {STOREFRONT_FOOTER.payment}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#9CA3AF] sm:flex-row sm:px-6">
          <p>© 2026 Capstone Project Dosen Pengampu Dr. Ir. Eka Wahyu Hidayat, S.T., M.T., MCE.</p>
          <p className="flex gap-4">
            <FooterLink label="Kebijakan Privasi" />
            <FooterLink label="Syarat & Ketentuan" />
          </p>
        </div>
      </div>
    </footer>
  );
}
