import { PackageOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { OrderCodeLookupForm } from "./order-code-lookup-form";

export function OrderHistoryEmpty({
  onBrowse,
  onLookup,
}: {
  onBrowse: () => void;
  onLookup: (code: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-6 text-center sm:p-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
        <PackageOpen size={23} aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-lg font-extrabold tracking-tight text-[#1A1A1A]">
        Belum ada pesanan
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6B7280]">
        Mulai dari satu rangkaian kecil, lalu pantau perjalanannya di sini.
        Sudah punya kode pesanan? Lacak langsung tanpa login.
      </p>

      <Button
        type="button"
        onClick={onBrowse}
        className="mt-4 h-10 rounded-lg bg-[#FF6B35] px-4 text-sm font-semibold text-[#21140D] hover:bg-[#F25C26]"
      >
        Jelajahi katalog
      </Button>

      <div className="mx-auto mt-5 max-w-sm border-t border-[#F3F4F6] pt-4 text-left">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Lacak dengan kode
        </p>
        <OrderCodeLookupForm onSubmit={onLookup} />
      </div>
    </section>
  );
}
