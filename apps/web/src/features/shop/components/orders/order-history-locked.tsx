import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "~/components/ui/button";
import { OrderCodeLookupForm } from "./order-code-lookup-form";

export function OrderHistoryLocked({
  onEnableDemo,
  onLookup,
}: {
  onEnableDemo: () => void;
  onLookup: (code: string) => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center shadow-sm sm:p-7">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
        <LockKeyhole size={23} aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-lg font-extrabold tracking-tight text-[#1A1A1A]">
        Riwayat pesanan terkunci
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6B7280]">
        Aktifkan mode login demo untuk melihat seluruh riwayat pesanan Sari
        Amelia. Kamu juga tetap bisa melacak satu pesanan dengan kodenya.
      </p>

      <Button
        type="button"
        onClick={onEnableDemo}
        className="mt-4 h-10 rounded-lg bg-[#FF6B35] px-4 text-sm font-semibold text-[#21140D] hover:bg-[#F25C26]"
      >
        Aktifkan login demo
      </Button>

      <div className="mx-auto mt-5 max-w-sm border-t border-[#F3F4F6] pt-4 text-left">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Lacak dengan kode
        </p>
        <OrderCodeLookupForm onSubmit={onLookup} />
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#6B7280]">
        <ShieldCheck
          size={13}
          aria-hidden="true"
          className="text-emerald-600"
        />
        Mode demo ini hanya menyimpan data di browser.
      </p>
    </section>
  );
}
