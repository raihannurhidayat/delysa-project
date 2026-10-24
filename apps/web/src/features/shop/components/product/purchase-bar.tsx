import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { QuantityStepper } from "~/features/shop/components/product/quantity-stepper";
import { formatIDR } from "~/features/shop/lib/format";
import { cn } from "~/lib/utils";

/**
 * Bar pembelian PDP: stepper + ATC + wishlist + Beli Langsung.
 * Stok-0 → semua disabled dengan label "Stok Habis".
 */
export function PurchaseBar({
  qty,
  max,
  price,
  onQty,
  onAdd,
  onBuyNow,
  wishlisted,
  onWishlist,
}: {
  qty: number;
  max: number;
  price: number;
  onQty: (v: number) => void;
  onAdd: () => void;
  onBuyNow: () => void;
  wishlisted: boolean;
  onWishlist: () => void;
}) {
  const soldOut = max <= 0;

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <QuantityStepper value={qty} max={max} onChange={onQty} />
        <Button
          type="button"
          onClick={onAdd}
          disabled={soldOut}
          className="h-11 flex-1 rounded-lg bg-[#111111] text-xs font-extrabold tracking-wide text-white uppercase hover:bg-[#2A2A2A] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
        >
          <ShoppingBag size={16} aria-hidden="true" />
          {soldOut
            ? "Stok Habis"
            : `Tambah ke Keranjang • ${formatIDR(price * qty)}`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onWishlist}
          aria-label={wishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
          aria-pressed={wishlisted}
          className={cn(
            "h-11 w-11 shrink-0 rounded-lg",
            wishlisted && "border-rose-300 bg-rose-50",
          )}
        >
          <Heart
            size={18}
            aria-hidden="true"
            className={wishlisted ? "fill-rose-600 text-rose-600" : ""}
          />
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onBuyNow}
        disabled={soldOut}
        className="mt-2 h-11 w-full rounded-lg border-[#111111] text-xs font-bold text-[#1A1A1A] hover:bg-[#F8F9FA] disabled:border-[#E5E7EB] disabled:text-[#9CA3AF]"
      >
        {soldOut ? "Stok Habis" : "Beli Langsung Sekarang"}
      </Button>
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-[#6B7280]">
        <input type="checkbox" className="mt-0.5 accent-[#111111]" />
        Minta foto buket jadi ke WhatsApp sebelum dikirim ke kurir
      </label>
    </div>
  );
}
