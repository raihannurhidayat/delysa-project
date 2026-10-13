export const PROMO_TOP_BAR_MESSAGE =
  "GRATIS ONGKIR AREA TASIKMALAYA MIN. RP200.000 - BUKA 07.00-21.00 WIB - PESAN HARI INI SIAP ANTAR";

/**
 * Bar pengumuman promo di atas header toko. Render statis di awal dokumen
 * (tanpa JS/state) sehingga tidak menyebabkan layout shift; ikut hilang
 * saat scroll karena berada di luar `ShopHeader` yang sticky.
 */
export function PromoTopBar({
  message = PROMO_TOP_BAR_MESSAGE,
}: {
  message?: string;
}) {
  return (
    <div
      role="region"
      aria-label="Info promo"
      className="bg-[#111111] text-white"
    >
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.08em] uppercase sm:text-xs">
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse"
        />
        <span className="truncate">{message}</span>
      </p>
    </div>
  );
}
