import {
  AlertTriangleIcon,
  Flower2Icon,
  ShoppingBagIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import {
  formatCompactNumber,
  formatRupiah,
  summarizeProducts,
} from "../../lib/products/product-filters";
import type { AdminProduct } from "../../lib/products/product.types";

type StatCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "orange" | "green" | "amber" | "red";
  valueClassName: string;
};

const TONE_CLASS: Record<StatCard["tone"], string> = {
  orange: "bg-[#FFF3ED] text-[#FF6B35]",
  green: "bg-[#DCFCE7] text-[#16A34A]",
  amber: "bg-[#FFEDD5] text-[#C2410C]",
  red: "bg-[#FEE2E2] text-[#DC2626]",
};

export function ProductsStatsCards({ products }: { products: AdminProduct[] }) {
  const summary = summarizeProducts(products);
  const cards: StatCard[] = [
    {
      label: "Total Produk",
      value: `${summary.total}`,
      note: `${summary.published} tayang publik di web`,
      icon: Flower2Icon,
      tone: "orange",
      valueClassName: "text-[#1A1A1A]",
    },
    {
      label: "Pendapatan Produk",
      value: formatRupiah(summary.revenue),
      note: `${formatCompactNumber(summary.totalSales)} unit terjual`,
      icon: WalletIcon,
      tone: "green",
      valueClassName: "text-[#1A1A1A]",
    },
    {
      label: "Produk Terjual",
      value: formatCompactNumber(summary.totalSales),
      note: "Akumulasi seluruh katalog",
      icon: ShoppingBagIcon,
      tone: "orange",
      valueClassName: "text-[#1A1A1A]",
    },
    {
      label: "Peringatan Stok",
      value: `${summary.lowStock}`,
      note: `${summary.outOfStock} habis · ${summary.lowStock} menipis`,
      icon: AlertTriangleIcon,
      tone: summary.lowStock + summary.outOfStock > 0 ? "red" : "green",
      valueClassName:
        summary.lowStock + summary.outOfStock > 0
          ? "text-[#C2410C]"
          : "text-[#166534]",
    },
  ];

  return (
    <div
      className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      role="list"
      aria-label="Ringkasan katalog produk"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            role="listitem"
            className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${TONE_CLASS[card.tone]}`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>
              <p className="min-w-0 truncate text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
                {card.label}
              </p>
            </div>
            <p
              className={`mt-3 truncate text-xl font-extrabold tracking-tight ${card.valueClassName}`}
              title={card.value}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              {card.note}
            </p>
          </div>
        );
      })}
    </div>
  );
}
