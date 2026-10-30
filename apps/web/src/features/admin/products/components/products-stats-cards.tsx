import { AlertTriangleIcon, Flower2Icon, PackageXIcon } from "lucide-react";
import type { AdminProduct } from "../lib/product.types";
import { getStockStatus } from "../lib/product-filters";

export function ProductsStatsCards({ products }: { products: AdminProduct[] }) {
  const total = products.length;
  const published = products.filter((p) => p.isPublished).length;
  const lowStock = products.filter((p) => getStockStatus(p) === "menipis").length;
  const outOfStock = products.filter((p) => getStockStatus(p) === "habis").length;

  const cards = [
    {
      label: "Total Produk",
      value: `${total} Produk`,
      note: `${published} tayang publik di web`,
      icon: Flower2Icon,
      valueClassName: "text-foreground",
      noteClassName: "text-[#16A34A]",
    },
    {
      label: "Peringatan Low-Stock",
      value: `${lowStock} Perlu Restock`,
      note: "Stok ≤ threshold minimum harian",
      icon: AlertTriangleIcon,
      valueClassName: "text-[#C2410C]",
      noteClassName: "text-muted-foreground",
    },
    {
      label: "Habis / Stok-0",
      value: `${outOfStock} Out of Stock`,
      note: "Tetap tampil di back-office, non-aktif di web",
      icon: PackageXIcon,
      valueClassName: "text-[#DC2626]",
      noteClassName: "text-muted-foreground",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-3" role="list" aria-label="Ringkasan katalog produk">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            role="listitem"
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
                {card.label}
              </p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>
            <p className={`mt-2 text-xl font-extrabold tracking-tight sm:text-2xl ${card.valueClassName}`}>
              {card.value}
            </p>
            <p className={`mt-1 text-xs leading-relaxed ${card.noteClassName}`}>
              {card.note}
            </p>
          </div>
        );
      })}
    </div>
  );
}
