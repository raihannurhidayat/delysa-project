import { Check, Minus, Trash2 } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";

interface CartSelectBarProps {
  itemCount: number;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  onDeleteSelected: () => void;
}

export function CartSelectBar({
  itemCount,
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  onDeleteSelected,
}: CartSelectBarProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={onToggleAll}
          aria-label={allSelected ? "Batalkan pilih semua" : "Pilih semua item"}
          className="shrink-0"
        />
        <span className="text-sm font-medium text-[#1A1A1A]">
          Pilih Semua Item ({itemCount})
        </span>
      </div>
      {selectedCount > 0 && (
        <Button
          type="button"
          onClick={onDeleteSelected}
          variant="ghost"
          size="sm"
          className="gap-1.5 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} aria-hidden="true" />
          Hapus Pilihan ({selectedCount})
        </Button>
      )}
    </div>
  );
}
