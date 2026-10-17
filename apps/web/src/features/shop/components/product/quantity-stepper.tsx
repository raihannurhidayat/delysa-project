import { Minus, Plus } from "lucide-react";
import { clampQty } from "~/features/shop/lib/product-detail";

/**
 * Stepper qty PDP: target sentuh ≥44px, clamp ke [1, max],
 * max<=0 → seluruh kontrol disabled (stok habis).
 */
export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const disabled = max <= 0;

  return (
    <div
      className="flex h-11 items-center rounded-lg border border-[#E5E7EB] bg-white"
      role="group"
      aria-label="Jumlah pembelian"
    >
      <button
        type="button"
        onClick={() => onChange(clampQty(value - 1, max))}
        disabled={disabled || value <= 1}
        aria-label="Kurangi jumlah"
        className="flex size-11 items-center justify-center rounded-l-lg text-[#1A1A1A] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        type="number"
        value={disabled ? 0 : value}
        min={1}
        max={Math.max(max, 1)}
        disabled={disabled}
        onChange={(e) => onChange(clampQty(Number(e.target.value), max))}
        aria-label="Jumlah"
        className="h-full w-10 border-x border-[#E5E7EB] text-center text-sm font-bold tabular-nums outline-none disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]"
      />
      <button
        type="button"
        onClick={() => onChange(clampQty(value + 1, max))}
        disabled={disabled || value >= max}
        aria-label="Tambah jumlah"
        className="flex size-11 items-center justify-center rounded-r-lg text-[#1A1A1A] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
