import { Percent, Truck } from "lucide-react";
import { formatIDR } from "~/features/shop/lib/format";
import { FREE_SHIPPING_MIN } from "~/features/shop/lib/cart-rules";

interface FreeShippingProgressProps {
  subtotal: number;
}

export function FreeShippingProgress({ subtotal }: FreeShippingProgressProps) {
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  const remaining = Math.max(0, FREE_SHIPPING_MIN - subtotal);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-emerald-600" aria-hidden="true" />
          <span className="text-sm font-medium text-[#1A1A1A]">
            Gratis Ongkir Area Tasikmalaya
          </span>
        </div>
        {subtotal >= FREE_SHIPPING_MIN && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <Percent size={10} aria-hidden="true" />
            100% TERCAPAI
          </span>
        )}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-xs text-[#6B7280]">
        {subtotal >= FREE_SHIPPING_MIN
          ? "Gratis ongkir untuk area Tasikmalaya radius 15 km"
          : `Tambahkan ${formatIDR(remaining)} lagi untuk Gratis Ongkir Area Tasikmalaya!`}
      </p>
    </div>
  );
}
