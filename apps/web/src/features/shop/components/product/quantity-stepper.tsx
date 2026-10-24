import { Minus, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { clampQty } from "~/features/shop/lib/product-detail";
import { cn } from "~/lib/utils";

/**
 * Stepper qty PDP: satu tombol gabungan (−, nilai, +) dalam rounded container,
 * tanpa input angka bawaan (hindari spinner native). Override penuh pada
 * `ui/button` agar Base UI tidak bawa rounded-4xl / border transparan /
 * focus ring yang pecah UI.
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

  const buttonClass = cn(
    "flex-1 border-0 rounded-none bg-white px-3 py-2 text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-0 disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-50",
    disabled ? "text-[#9CA3AF]" : "",
  );

  return (
    <div
      className="inline-flex items-center rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
      role="group"
      aria-label="Jumlah pembelian"
    >
      <Button
        type="button"
        onClick={() => onChange(clampQty(value - 1, max))}
        disabled={disabled || value <= 1}
        aria-label="Kurangi jumlah"
        aria-disabled={disabled || value <= 1}
        className={buttonClass}
      >
        <Minus size={16} aria-hidden="true" />
      </Button>
      <span
        aria-valuenow={disabled ? 0 : value}
        aria-valuemin={1}
        aria-valuemax={Math.max(max, 1)}
        className="flex-1 border-x border-[#E5E7EB] flex items-center justify-center px-2 text-xs font-bold tabular-nums text-[#1A1A1A] disabled:text-[#9CA3AF]"
      >
        {disabled ? 0 : value}
      </span>
      <Button
        type="button"
        onClick={() => onChange(clampQty(value + 1, max))}
        disabled={disabled || value >= max}
        aria-label="Tambah jumlah"
        aria-disabled={disabled || value >= max}
        className={buttonClass}
      >
        <Plus size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
