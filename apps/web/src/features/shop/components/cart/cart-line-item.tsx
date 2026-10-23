import { Check, Minus, Plus, Save, Trash2, X } from "lucide-react";
import { formatIDR } from "~/features/shop/lib/format";
import { QuantityStepper } from "~/features/shop/components/product/quantity-stepper";
import { Checkbox } from "~/components/ui/checkbox";
import type { MiniCartLine } from "~/features/shop/types";

interface CartLineItemProps {
  line: MiniCartLine;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  onSaveLater: () => void;
  /** Tampilkan checkbox pilih massal (default true). */
  showSelection?: boolean;
  /** Tampilkan tombol simpan untuk nanti (default true). */
  showSaveLater?: boolean;
}

export function CartLineItem({
  line,
  selected,
  onSelectedChange,
  onQtyChange,
  onRemove,
  onSaveLater,
  showSelection = true,
  showSaveLater = true,
}: CartLineItemProps) {
  const key = `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`;
  const lineTotal = line.price * line.qty;
  const originalLineTotal = line.originalPrice
    ? line.originalPrice * line.qty
    : null;

  return (
    <div className="flex gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
      {showSelection && (
        <Checkbox
          checked={selected}
          onCheckedChange={onSelectedChange}
          aria-label={`Pilih ${line.name}`}
          className="mt-1 shrink-0"
        />
      )}
      <div className="aspect-square w-20 shrink-0 rounded-lg bg-white overflow-hidden border border-[#E5E7EB]">
        <img
          src={line.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">
              {line.name}
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Varian: {line.sizeLabel}{" "}
              {line.wrapLabel ? `• ${line.wrapLabel}` : ""}
            </p>
            {line.bonuses && line.bonuses.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {line.bonuses.map((bonus, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                  >
                    <Check size={10} aria-hidden="true" />
                    {bonus}
                  </span>
                ))}
              </div>
            )}
          </div>
          {showSaveLater && (
            <button
              type="button"
              onClick={onSaveLater}
              className="shrink-0 flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
              aria-label="Simpan untuk nanti"
            >
              <Save size={12} aria-hidden="true" /> Simpan
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QuantityStepper
              value={line.qty}
              max={line.maxQty ?? 10}
              onChange={onQtyChange}
            />
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 flex items-center justify-center size-8 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition-colors"
              aria-label={`Hapus ${line.name}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-sm font-bold text-[#1A1A1A]">
              {formatIDR(lineTotal)}
            </span>
            {originalLineTotal && originalLineTotal > lineTotal && (
              <span className="text-xs line-through text-[#9CA3AF]">
                {formatIDR(originalLineTotal)}
              </span>
            )}
            {line.qty > 1 && (
              <span className="text-[11px] text-[#9CA3AF]">
                @ {formatIDR(line.price)} × {line.qty}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
