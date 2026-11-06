import { Badge } from "~/components/ui/badge";
import { cn } from "cn";

type AtelierStep = {
  label: string;
  status: "pending" | "active" | "done";
};

const STEPS: AtelierStep[] = [
  { label: "Menunggu Verifikasi", status: "pending" },
  { label: "Sedang Dikerjakan", status: "pending" },
  { label: "Dalam Pengantaran", status: "pending" },
  { label: "Selesai Terkirim", status: "pending" },
];

/**
 * Status pemenuhan atelier 4-tahap sesuai desain detail pesanan.
 * Menghasilkan satu tahap aktif berdasarkan status order.
 */
export function AdminOrderAtelierStepper({ status }: { status: string }) {
  const activeIndex = atelierStepIndex(status);
  const steps = STEPS.map((step, index) => ({
    ...step,
    status:
      index < activeIndex
        ? "done"
        : index === activeIndex
          ? "active"
          : "pending",
  }));

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
        <span>Status Pemenuhan Atelier</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={cn("flex items-center gap-2", index > 0 && "pl-8")}
          >
            {index > 0 && (
              <div className="h-[1px] flex-1 bg-[#E5E7EB]" aria-hidden="true" />
            )}
            <Badge
              className={cn(
                "size-5 shrink-0 rounded-full text-[10px] font-bold",
                step.status === "done"
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : step.status === "active"
                    ? "bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]/20"
                    : "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]",
              )}
            >
              {step.label}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function atelierStepIndex(status: string): number {
  switch (status) {
    case "pending_payment":
    case "pending_verification":
      return 0;
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
