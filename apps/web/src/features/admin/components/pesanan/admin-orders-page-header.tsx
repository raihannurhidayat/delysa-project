import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

export function AdminOrdersPageHeader({
  onCreateManual,
}: {
  onCreateManual(): void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#FF6B35] uppercase">
          Back-Office · Orders
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Manajemen Pesanan &amp; Antrian Fulfillment
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          Verifikasi pembayaran, kelola antrean perakitan atelier, dan pantau
          pengantar pesanan dari satu tempat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onCreateManual}
          className="h-9 gap-1.5 rounded-lg bg-[#FF6B35] px-3.5 text-xs font-bold text-white hover:bg-[#E85B27]"
        >
          <PlusIcon size={15} aria-hidden="true" />
          Buat Pesanan Manual
        </Button>
      </div>
    </div>
  );
}
