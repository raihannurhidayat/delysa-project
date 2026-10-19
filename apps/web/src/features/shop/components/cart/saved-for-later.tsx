import { ArrowRight, Save, Trash2, X } from "lucide-react";
import { formatIDR } from "~/features/shop/lib/format";
import { Button } from "~/components/ui/button";
import type { MiniCartLine } from "~/features/shop/types";

interface SavedForLaterProps {
  lines: MiniCartLine[];
  onMoveToCart: (key: string) => void;
  onRemove: (key: string) => void;
}

export function SavedForLater({
  lines,
  onMoveToCart,
  onRemove,
}: SavedForLaterProps) {
  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-[#1A1A1A]"
        aria-expanded="true"
      >
        <span>Disimpan untuk Nanti ({lines.length})</span>
        <Save size={16} className="text-[#6B7280]" aria-hidden="true" />
      </button>
      <div className="mt-3 space-y-3">
        {lines.map((line) => (
          <div
            key={`${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`}
            className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-2"
          >
            <div className="aspect-square w-14 shrink-0 rounded-lg bg-white overflow-hidden border border-[#E5E7EB]">
              <img
                src={line.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">
                {line.name}
              </p>
              <p className="text-xs text-[#6B7280]">
                {formatIDR(line.price)} × {line.qty}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                onClick={() =>
                  onMoveToCart(
                    `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                  )
                }
                size="sm"
                className="gap-1 rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
              >
                <ArrowRight size={12} aria-hidden="true" /> Pindahkan
              </Button>
              <button
                type="button"
                onClick={() =>
                  onRemove(
                    `${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`,
                  )
                }
                className="shrink-0 flex items-center justify-center size-8 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition-colors"
                aria-label={`Hapus ${line.name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
