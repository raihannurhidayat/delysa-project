import { MessageCircle, Sparkles } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { WHATSAPP_NUMBER } from "~/features/checkout/payment-methods";
import { DEMO_CUSTOMER_NAME } from "~/features/shop/lib/demo-auth-store";

export function OrderHistoryHeader({ isCustomer }: { isCustomer: boolean }) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#FF6B35] uppercase">
          Akun Delysa
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-3xl">
          Pesanan Saya
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-[#6B7280]">
          Pantau status rangkaian, unduh bukti pembayaran, dan pesan kembali
          buket favoritmu.
        </p>
        {isCustomer ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3ED] px-3 py-1 text-xs font-semibold text-[#C2410C] ring-1 ring-[#FFE1D2]">
            <Sparkles size={13} aria-hidden="true" />
            {`Halo, ${DEMO_CUSTOMER_NAME.split(" ")[0]}`}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFBF7] p-4 sm:max-w-xs">
        <p className="text-sm font-bold text-[#1A1A1A]">Butuh bantuan?</p>
        <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
          Tim kami siap membantu cek pesanan, pembayaran, atau pengiriman.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            className:
              "mt-3 h-9 w-full rounded-lg border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]",
          })}
        >
          <MessageCircle size={14} aria-hidden="true" className="mr-1.5" />
          Chat admin via WhatsApp
        </a>
      </div>
    </header>
  );
}
