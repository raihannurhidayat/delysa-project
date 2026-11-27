import {
  Flower2Icon,
  PackageCheckIcon,
  ReceiptTextIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "cn";

export type AdminOrderQueue = "verification" | "assembly" | "delivery";

type QueueCard = {
  id: AdminOrderQueue;
  title: string;
  count: number;
  icon: LucideIcon;
  chip: { label: string; className: string };
  note: string;
};

export function AdminOrderStatsCards({
  verification,
  assembly,
  delivery,
  onSelect,
}: {
  verification: number;
  assembly: number;
  delivery: number;
  onSelect(queue: AdminOrderQueue): void;
}) {
  const cards: QueueCard[] = [
    {
      id: "verification",
      title: "Menunggu Verifikasi Resi",
      count: verification,
      icon: ReceiptTextIcon,
      chip: { label: "Prioritas 1", className: "bg-[#FEE2E2] text-[#B91C1C]" },
      note: "Bukti transfer menunggu konfirmasi admin",
    },
    {
      id: "assembly",
      title: "Sedang Dirangkai Hari Ini",
      count: assembly,
      icon: Flower2Icon,
      chip: {
        label: "Atelier Queue",
        className: "bg-[#FFF3ED] text-[#C2410C]",
      },
      note: "Sedang dikerjakan meja florist",
    },
    {
      id: "delivery",
      title: "Dalam Pengantaran",
      count: delivery,
      icon: PackageCheckIcon,
      chip: { label: "On Road", className: "bg-[#DCFCE7] text-[#166534]" },
      note: "Kurir membawa pesanan ke pelanggan",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect(card.id)}
          data-queue={card.id}
          className="flex h-full flex-col gap-4 rounded-3xl bg-white p-5 text-left shadow-md ring-1 ring-foreground/5 transition-colors hover:ring-[#FF6B35]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/40"
        >
          {/* Header: ikon + angka di kiri, badge di kanan */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3ED] text-[#FF6B35]"
              >
                <card.icon size={18} />
              </span>
              <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-[#111111]">
                {card.count}
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 whitespace-nowrap border-transparent text-[10px]",
                card.chip.className,
              )}
            >
              {card.chip.label}
            </Badge>
          </div>

          {/* Konten: judul + keterangan */}
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-[#1A1A1A]">{card.title}</p>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              {card.note}
            </p>
          </div>

          <span className="sr-only">Tampilkan tab {card.title}</span>
        </button>
      ))}
    </div>
  );
}
