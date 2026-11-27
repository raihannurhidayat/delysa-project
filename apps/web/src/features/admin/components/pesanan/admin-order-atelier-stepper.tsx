import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "cn";

type AtelierStep = {
  label: string;
  caption: string;
  status: "pending" | "active" | "done";
};

const STEPS: Omit<AtelierStep, "status">[] = [
  { label: "Menunggu Verifikasi", caption: "Validasi mutasi & bukti bayar" },
  { label: "Sedang Dikerjakan", caption: "Perangkaian di meja florist" },
  { label: "Dalam Pengantaran", caption: "Pengiriman oleh kurir atelier" },
  { label: "Selesai Terkirim", caption: "Pesanan diterima pelanggan" },
];

/**
 * Status pemenuhan atelier 4-tahap sesuai desain detail pesanan.
 * Menghasilkan satu tahap aktif berdasarkan status order.
 */
export function AdminOrderAtelierStepper({ status }: { status: string }) {
  const activeIndex = atelierStepIndex(status);
  const steps: AtelierStep[] = STEPS.map((step, index) => ({
    ...step,
    status:
      index < activeIndex
        ? "done"
        : index === activeIndex
          ? "active"
          : "pending",
  }));

  return (
    <ol
      className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Tahapan pemenuhan atelier"
    >
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={cn(
            "relative flex flex-col justify-between rounded-xl border p-3.5 transition-colors",
            step.status === "active"
              ? "border-[#FF6B35]/40 bg-[#FFFBF8] shadow-xs"
              : step.status === "done"
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-[#E5E7EB] bg-[#F9FAFB]/60",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 transition-colors",
                step.status === "done"
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : step.status === "active"
                    ? "bg-[#FF6B35] text-white ring-[#FF6B35]"
                    : "bg-white text-[#9CA3AF] ring-[#E5E7EB]",
              )}
            >
              {step.status === "done" ? <Check size={13} /> : index + 1}
            </span>

            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                step.status === "done"
                  ? "text-emerald-700"
                  : step.status === "active"
                    ? "text-[#C2410C]"
                    : "text-[#9CA3AF]",
              )}
            >
              {step.status === "done"
                ? "Selesai"
                : step.status === "active"
                  ? "Tahap Aktif"
                  : "Menunggu"}
            </span>
          </div>

          <div className="mt-2.5">
            <Badge
              className={cn(
                "h-auto rounded-lg px-2.5 py-1 text-xs font-semibold ring-1",
                step.status === "done"
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : step.status === "active"
                    ? "bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]/30"
                    : "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
              )}
            >
              {step.label}
            </Badge>
            <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
              {step.caption}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function atelierStepIndex(status: string): number {
  switch (status) {
    case "pending_payment":
    case "pending_verification":
      return 0;
    case "paid":
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return STEPS.length; // semua tahap selesai
    default:
      return 0;
  }
}
