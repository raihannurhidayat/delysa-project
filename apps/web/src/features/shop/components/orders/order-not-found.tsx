import { MessageCircle, PackageX } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { WHATSAPP_NUMBER } from "~/features/shop/lib/payment-methods";
import { OrderCodeLookupForm } from "./order-code-lookup-form";

export function OrderNotFound({
  code,
  onLookup,
}: {
  code: string;
  onLookup: (code: string) => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center shadow-sm sm:p-7">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
        <PackageX size={23} aria-hidden="true" />
      </span>
      <h1 className="mt-3 text-lg font-extrabold tracking-tight text-[#1A1A1A]">
        Pesanan tidak ditemukan
      </h1>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6B7280]">
        Kami tidak menemukan pesanan dengan kode{" "}
        <span className="font-mono font-semibold text-[#1A1A1A]">{code}</span>.
        Periksa kembali kode pesanan atau hubungi admin.
      </p>

      <div className="mt-4 text-left">
        <OrderCodeLookupForm initialCode={code} onSubmit={onLookup} />
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({
          variant: "outline",
          className:
            "mt-3 h-10 w-full rounded-lg border-[#E5E7EB] bg-white font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]",
        })}
      >
        <MessageCircle size={15} aria-hidden="true" className="mr-1.5" />
        Hubungi admin via WhatsApp
      </a>
    </section>
  );
}
