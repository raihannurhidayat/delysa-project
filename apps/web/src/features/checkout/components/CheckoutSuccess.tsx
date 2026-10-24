"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  Landmark,
  MessageCircle,
  Package,
  QrCode,
  ShoppingBag,
} from "lucide-react";

import { Button, buttonVariants } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { formatIDR } from "~/features/shop/lib/format";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { PaymentProofUploader } from "~/features/shop/components/orders/payment-proof-uploader";
import type { OrderResponse } from "../api/endpoints";
import {
  getPaymentMethod,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
} from "../payment-methods";
import type { PaymentMethod } from "../types";

interface CheckoutSuccessProps {
  order: OrderResponse;
  paymentMethod: PaymentMethod | "";
}

export function CheckoutSuccess({
  order,
  paymentMethod,
}: CheckoutSuccessProps) {
  const method = getPaymentMethod(paymentMethod);
  const bank = method?.bank;
  const isQris = method?.id === "qris";

  const [status, setStatus] = useState(order.status);

  const showProofSummary = status === "pending_verification";

  const proofNote = showProofSummary
    ? " Bukti pembayaran sudah saya unggah."
    : "";
  const methodText = method ? ` dengan metode ${method.label}` : "";
  const whatsappMessage =
    isQris && !showProofSummary
      ? `Halo Delysa Florist, saya memilih QRIS untuk pesanan ${order.code} sebesar ${formatIDR(order.total)}. Mohon kirimkan QR code QRIS.`
      : `Halo Delysa Florist, saya membuat pesanan ${order.code} sebesar ${formatIDR(order.total)}${methodText}.${proofNote} Mohon konfirmasi pembayaran.`;
  const whatsappLabel =
    isQris && !showProofSummary
      ? "Minta QRIS via WhatsApp"
      : "Konfirmasi via WhatsApp";

  const copyValue = async (value: string, label: string) => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API tidak tersedia");
      }
      await navigator.clipboard.writeText(value);
      toast.add({ title: `${label} disalin`, type: "success" });
    } catch {
      toast.add({
        title: "Gagal menyalin",
        description: `Salin ${label.toLowerCase()} secara manual.`,
        type: "error",
      });
    }
  };

  return (
    <section
      aria-labelledby="checkout-success-heading"
      data-testid="checkout-success"
      className="mx-auto w-full max-w-3xl"
    >
      <div
        data-testid="checkout-success-card"
        className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white text-[#1A1A1A] shadow-[0_16px_48px_-32px_rgba(17,24,39,0.28)]"
      >
        <div className="h-1 bg-[#FF6B35]" />
        <div className="p-4 sm:p-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 size={22} aria-hidden="true" />
              </span>
              <div>
                <h1
                  id="checkout-success-heading"
                  className="text-lg font-extrabold tracking-tight sm:text-xl"
                >
                  Pesanan Berhasil Dibuat
                </h1>
                <p className="mt-0.5 max-w-md text-xs leading-relaxed text-[#6B7280] sm:text-[13px]">
                  Terima kasih! Pesananmu sudah tercatat. Selesaikan pembayaran
                  agar segera kami proses.
                </p>
              </div>
            </div>

            <OrderStatusBadge
              status={status}
              data-testid="order-status"
              className="px-2 py-0.5 text-[10px] sm:mt-0.5"
            />
          </header>

          <div
            data-testid="checkout-success-body"
            className="mt-5 flex flex-col gap-3.5"
          >
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 sm:p-4">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">
                  Total Pembayaran
                </p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-3xl">
                  {formatIDR(order.total)}
                </p>
              </div>

              <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#6B7280] sm:text-[11px]">
                      Kode Pesanan
                    </p>
                    <p
                      data-testid="order-code"
                      className="mt-0.5 break-all font-mono text-sm font-bold tracking-wide text-[#1A1A1A] sm:text-base"
                    >
                      {order.code}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Salin kode pesanan"
                    onClick={() => void copyValue(order.code, "Kode pesanan")}
                    className="shrink-0 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                  >
                    <Copy size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              data-testid="payment-instructions-success"
              className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 sm:p-4"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
                  {bank ? (
                    <Landmark size={17} aria-hidden="true" />
                  ) : (
                    <QrCode size={17} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-[#6B7280] sm:text-[11px]">
                    Instruksi Pembayaran
                  </p>
                  <p className="text-xs font-bold text-[#1A1A1A] sm:text-[13px]">
                    {method?.label ?? "Metode pembayaran belum tercatat"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">
                    {method?.description ??
                      "Hubungi admin untuk mendapatkan instruksi pembayaran."}
                  </p>
                </div>
              </div>

              {bank ? (
                <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-[#6B7280] sm:text-[11px]">
                        Rekening {bank.name}
                      </p>
                      <p className="mt-0.5 font-mono text-base font-bold tracking-[0.08em] text-[#1A1A1A] min-[360px]:whitespace-nowrap sm:text-lg">
                        {bank.accountNumber}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#6B7280] sm:text-xs">
                        a.n. {bank.accountName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Salin nomor rekening"
                      onClick={() =>
                        void copyValue(bank.accountNumber, "Nomor rekening")
                      }
                      className="shrink-0 rounded-full bg-white"
                    >
                      <Copy size={13} aria-hidden="true" />
                      Salin
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <QrCode size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A] sm:text-[13px]">
                      QR code dikirim via WhatsApp
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">
                      Minta QRIS ke admin, lalu unggah bukti pembayaran di
                      halaman ini.
                    </p>
                  </div>
                </div>
              )}

              {method?.steps.length ? (
                <ol className="mt-3 space-y-1.5">
                  {method.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-2 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs"
                    >
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[9px] font-bold text-[#C2410C]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              <p className="mt-2.5 border-t border-[#E5E7EB] pt-2.5 text-[10px] text-[#6B7280] sm:text-[11px]">
                Selesaikan pembayaran dalam 1×24 jam setelah pesanan dibuat.
              </p>
            </div>

            <PaymentProofUploader
              orderId={order.id}
              status={status}
              onStatusChange={setStatus}
              description={
                bank
                  ? "Unggah bukti transfer agar pesanan segera diverifikasi."
                  : "Unggah bukti pembayaran QRIS agar pesanan segera diverifikasi."
              }
            />

            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  whatsappMessage,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className:
                    "h-10 w-full rounded-lg bg-[#25D366] font-semibold text-[#071C12] hover:bg-[#1FBD5A]",
                })}
              >
                <MessageCircle
                  size={16}
                  aria-hidden="true"
                  className="mr-1.5"
                />
                {whatsappLabel}
              </a>

              <Link
                to="/status-pesanan/$kodePesanan"
                params={{ kodePesanan: order.code }}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 w-full rounded-lg border-[#E5E7EB] bg-white font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]",
                })}
              >
                Lacak status pesanan
              </Link>

              <Link
                to="/katalog"
                className={buttonVariants({
                  variant: "ghost",
                  className:
                    "h-9 w-full rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]",
                })}
              >
                <ShoppingBag size={15} aria-hidden="true" className="mr-1.5" />
                Kembali Belanja
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-[#E5E7EB] pt-3 text-[10px] text-[#6B7280] sm:text-[11px]">
            <p className="flex items-center gap-1.5">
              <Package size={12} aria-hidden="true" />
              Pesanan diproses setelah pembayaran diverifikasi admin.
            </p>
            <p>
              Butuh bantuan?{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#4B5563] underline decoration-[#D1D5DB] underline-offset-2 hover:text-[#1A1A1A]"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
