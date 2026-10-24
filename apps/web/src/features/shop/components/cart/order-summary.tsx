import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ShieldCheck,
  Truck,
  Camera,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import type { CartCoupon } from "~/features/shop/types";
import { couponCodeSchema } from "~/features/shop/lib/cart-coupons";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";

interface OrderSummaryProps {
  totals: CartTotals;
  coupon: CartCoupon | null;
  onApplyCoupon: (code: string) => { ok: boolean; error?: string };
  onRemoveCoupon: () => void;
  checkoutDisabled: boolean;
  /** Sembunyikan CTA checkout & tombol kembali (dipakai di dalam wizard). */
  hideActions?: boolean;
}

export function OrderSummary({
  totals,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  checkoutDisabled,
  hideActions = false,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    const result = couponCodeSchema.safeParse(couponInput);
    if (!result.success) {
      setCouponError("Kode kupon minimal 3 karakter");
      return;
    }
    const res = onApplyCoupon(result.data);
    if (res.ok) {
      setCouponInput("");
      setCouponError("");
    } else {
      setCouponError(res.error ?? "Kode kupon tidak valid");
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h2 className="text-base font-extrabold text-[#1A1A1A]">
        Ringkasan Belanja
      </h2>

      <dl className="mt-3 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-[#6B7280]">
            Total Harga ({totals.itemCount} Produk)
          </dt>
          <dd className="font-bold text-[#1A1A1A]">
            {formatIDR(totals.subtotal)}
          </dd>
        </div>
        {totals.productDiscount > 0 && (
          <div className="flex justify-between text-green-700">
            <dt>Diskon Promo Produk</dt>
            <dd className="font-bold">−{formatIDR(totals.productDiscount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-[#6B7280]">Estimasi Ongkos Kirim</dt>
          <dd className="font-bold">
            {totals.freeShipping ? (
              <>
                GRATIS
                <span className="ml-2 text-xs line-through text-[#9CA3AF]">
                  {formatIDR(totals.shipping + totals.remainingForFree)}
                </span>
                <span className="ml-1 text-[11px] text-emerald-700">
                  Kota Tasikmalaya · radius 15 km
                </span>
              </>
            ) : (
              formatIDR(totals.shipping)
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#6B7280]">Kemasan Proteksi & Water-bag</dt>
          <dd className="font-bold text-emerald-700">GRATIS</dd>
        </div>

        <div className="flex items-center gap-2 border-t border-[#E5E7EB] pt-3">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => {
              const value = e.target.value ?? "";
              setCouponInput(value.toUpperCase());
              setCouponError("");
            }}
            placeholder="CONTOH: DELYSAWISUDA"
            className="flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
            aria-label="Kode kupon"
          />
          <Button
            type="button"
            onClick={handleApplyCoupon}
            size="sm"
            className="shrink-0 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
          >
            Terapkan
          </Button>
        </div>

        {couponError && (
          <Alert variant="destructive" className="mt-3">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="text-xs font-medium">
              Kode kupon tidak valid
            </AlertTitle>
            <AlertDescription className="text-xs">
              {couponError}
            </AlertDescription>
          </Alert>
        )}

        {coupon && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2">
            <span className="text-xs font-medium text-emerald-700">
              {coupon.code} — {coupon.label}{" "}
              {coupon.amount > 0
                ? `−${formatIDR(coupon.amount)}`
                : "(Potongan Pengguna Baru)"}
            </span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="shrink-0 flex items-center justify-center size-6 rounded text-emerald-700 hover:bg-emerald-100 transition-colors"
              aria-label={`Hapus kupon ${coupon.code}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex justify-between border-t border-[#E5E7EB] pt-3">
          <dt className="text-base font-extrabold text-[#1A1A1A]">
            Total Akhir
          </dt>
          <dd className="text-base font-extrabold text-[#1A1A1A]">
            {formatIDR(totals.grandTotal)}
          </dd>
        </div>
        <p className="text-[11px] text-[#9CA3AF] text-center">
          Termasuk PPn & garansi bunga mekar segar 100%
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {!hideActions && (
            <>
              {checkoutDisabled ? (
                <Button
                  type="button"
                  disabled
                  className="w-full rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF]"
                >
                  Lanjut ke Pembayaran (Checkout) →
                </Button>
              ) : (
                <Button
                  render={<Link to="/checkout" search={{ step: "review" }} />}
                  className="w-full rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
                >
                  Lanjut ke Pembayaran (Checkout) →
                </Button>
              )}
              <Button
                variant="ghost"
                render={<Link to="/katalog" />}
                className="w-full rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
              >
                <ChevronLeft size={14} aria-hidden="true" className="mr-1" />
                Kembali Belanja Katalog
              </Button>
            </>
          )}
        </div>

        <ul
          className="mt-4 hidden lg:flex flex-col gap-3"
          aria-label="Jaminan belanja"
        >
          {[
            {
              icon: ShieldCheck,
              title: "TRANSFER RESMI BCA",
              subtitle: "Pembayaran aman a.n. Kartinah",
            },
            {
              icon: Truck,
              title: "TEPAT WAKTU",
              subtitle: "Pengiriman sesuai jadwal",
            },
            {
              icon: Camera,
              title: "KONFIRMASI FOTO VIA WA",
              subtitle: "Pratinjau sebelum kurir jalan",
            },
          ].map((item) => (
            <li key={item.title} className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <item.icon size={16} aria-hidden="true" />
              </span>
              <span className="text-xs">
                <span className="block font-medium text-[#1A1A1A]">
                  {item.title}
                </span>
                <span className="block text-[11px] text-[#6B7280]">
                  {item.subtitle}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </dl>
    </div>
  );
}
