import { Copy, Landmark, MessageCircle, QrCode } from "lucide-react";
import type { OrderStatus } from "@delysa/shared";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import { useCountdown } from "~/features/shop/hooks/use-countdown";
import { copyText } from "~/features/shop/lib/clipboard";
import { formatIDR } from "~/features/shop/lib/format";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import type { OrderRecord } from "~/features/shop/types";
import { WHATSAPP_NUMBER } from "~/features/shop/lib/payment-methods";
import { PaymentProofUploader } from "./payment-proof-uploader";

const STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  pending_verification: "Bukti pembayaran sedang diverifikasi admin.",
  paid: "Pembayaran terverifikasi.",
  processing: "Pembayaran terverifikasi.",
  shipped: "Pembayaran terverifikasi.",
  delivered: "Pembayaran terverifikasi.",
  cancelled: "Pesanan dibatalkan.",
};

export function OrderPaymentCard({
  order,
  onStatusChange,
}: {
  order: OrderRecord;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const method = order.payment;
  const bank = method.bank;
  const isQris = method.methodId === "qris";
  const deadline = new Date(order.paymentDeadline);
  const countdown = useCountdown(deadline);
  const deadlinePassed = deadline.getTime() <= Date.now();
  const note = STATUS_NOTES[order.status];
  const whatsappMessage = isQris
    ? `Halo Delysa Florist, saya memilih QRIS untuk pesanan ${order.code} sebesar ${formatIDR(order.totals.grandTotal)}. Mohon kirimkan QR code QRIS.`
    : `Halo Delysa Florist, saya membuat pesanan ${order.code} sebesar ${formatIDR(order.totals.grandTotal)}. Mohon konfirmasi pembayaran.`;
  const whatsappLabel = isQris
    ? "Minta QRIS via WhatsApp"
    : "Konfirmasi via WhatsApp";

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#FF6B35] uppercase">
            Pembayaran
          </p>
          <h2 className="mt-1 text-base font-extrabold text-[#1A1A1A]">
            {method.label}
          </h2>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
          {bank ? (
            <Landmark size={17} aria-hidden="true" />
          ) : (
            <QrCode size={17} aria-hidden="true" />
          )}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-[#F9FAFB] p-3">
        <p className="text-[11px] text-[#6B7280]">Total pembayaran</p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
          {formatIDR(order.totals.grandTotal)}
        </p>
      </div>

      {bank ? (
        <div className="mt-3 rounded-xl border border-[#E5E7EB] p-3">
          <p className="text-[11px] text-[#6B7280]">Rekening {bank.name}</p>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="font-mono text-base font-bold tracking-[0.06em] text-[#1A1A1A]">
              {bank.accountNumber}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Salin nomor rekening"
              onClick={() =>
                void copyText(bank.accountNumber, "Nomor rekening")
              }
              className="shrink-0 rounded-full bg-white"
            >
              <Copy size={13} aria-hidden="true" />
              Salin
            </Button>
          </div>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            a.n. {bank.accountName}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#6B7280]">
          QR code dikirim admin via WhatsApp.
        </p>
      )}

      {note ? (
        <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">{note}</p>
      ) : null}

      {order.status === "rejected" ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Pembayaran ditolak</AlertTitle>
          <AlertDescription>
            Pembayaran ditolak. Hubungi admin untuk tindak lanjut.
          </AlertDescription>
        </Alert>
      ) : null}

      {deadlinePassed ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          Batas pembayaran telah lewat
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-[#FFF3ED] px-3 py-2">
          <p className="text-xs font-semibold text-[#C2410C]">
            Sisa waktu {countdown.hours}:{countdown.minutes}:{countdown.seconds}
          </p>
          <p className="text-[10px] text-[#9A3412]">
            Bayar sebelum {formatOrderDate(order.paymentDeadline)}
          </p>
        </div>
      )}

      <div className="mt-3">
        <PaymentProofUploader
          orderId={order.id}
          status={order.status}
          onStatusChange={onStatusChange}
          description={
            isQris
              ? "Unggah bukti pembayaran QRIS agar pesanan segera diverifikasi."
              : "Unggah bukti transfer agar pesanan segera diverifikasi."
          }
        />
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({
          className:
            "mt-3 h-10 w-full rounded-lg bg-[#25D366] font-semibold text-[#071C12] hover:bg-[#1FBD5A]",
        })}
      >
        <MessageCircle size={16} aria-hidden="true" className="mr-1.5" />
        {whatsappLabel}
      </a>
    </section>
  );
}
