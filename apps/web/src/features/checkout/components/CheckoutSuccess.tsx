"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
  MessageCircle,
  Package,
  QrCode,
  ShoppingBag,
  UploadCloud,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { formatIDR } from "~/features/shop/lib/format";
import { uploadPaymentProof, type OrderResponse } from "../api/endpoints";
import {
  getPaymentProofError,
  PAYMENT_PROOF_ACCEPT,
  formatFileSize,
} from "../lib/payment-proof";
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

const ORDER_STATUS_LABELS: Record<OrderResponse["status"], string> = {
  pending_payment: "Menunggu Pembayaran",
  pending_verification: "Menunggu Verifikasi",
  paid: "Pembayaran Terverifikasi",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export function CheckoutSuccess({
  order,
  paymentMethod,
}: CheckoutSuccessProps) {
  const method = getPaymentMethod(paymentMethod);
  const bank = method?.bank;
  const isQris = method?.id === "qris";

  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(order.status);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const showProofSummary =
    Boolean(uploadedFile) || status === "pending_verification";
  const canUpload = status === "pending_payment";
  const statusLabel = ORDER_STATUS_LABELS[status];
  const statusTone =
    status === "pending_payment"
      ? "bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]/20"
      : status === "pending_verification"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]";

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

  const selectFile = (file: File) => {
    const error = getPaymentProofError(order.id, file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    const error = getPaymentProofError(order.id, selectedFile);
    if (error) {
      setUploadError(error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const updatedOrder = await uploadPaymentProof(order.id, selectedFile);
      setStatus(updatedOrder.status);
      setUploadedFile(selectedFile);
      setSelectedFile(null);
      toast.add({
        title: "Bukti pembayaran terkirim",
        description: "Admin akan memverifikasi pembayaranmu.",
        type: "success",
      });
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah bukti pembayaran. Coba lagi.",
      );
      toast.add({
        title: "Gagal mengunggah bukti",
        description: "Periksa koneksi lalu coba lagi.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
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

            <span
              data-testid="order-status"
              className={cn(
                "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 sm:mt-0.5",
                statusTone,
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {statusLabel}
            </span>
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

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 sm:p-4">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A] sm:text-[13px]">
                  Upload bukti pembayaran
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">
                  {bank
                    ? "Unggah bukti transfer agar pesanan segera diverifikasi."
                    : "Unggah bukti pembayaran QRIS agar pesanan segera diverifikasi."}
                </p>
              </div>

              {showProofSummary ? (
                <div
                  role="status"
                  data-testid="upload-success"
                  className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-900 sm:text-[13px]">
                        Bukti pembayaran diterima
                      </p>
                      <p className="mt-0.5 break-all text-[11px] text-[#4B5563] sm:text-xs">
                        {uploadedFile?.name ?? "Bukti pembayaran"}
                        {uploadedFile
                          ? ` · ${formatFileSize(uploadedFile.size)}`
                          : ""}
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-emerald-700 sm:text-[11px]">
                        Menunggu verifikasi admin.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    id="payment-proof-input"
                    data-testid="payment-proof-input"
                    type="file"
                    accept={PAYMENT_PROOF_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) selectFile(file);
                      event.target.value = "";
                    }}
                  />

                  <div
                    data-testid="payment-proof-dropzone"
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "mt-2.5 rounded-xl border border-dashed p-3.5 text-center transition-colors",
                      isDragging
                        ? "border-[#FF6B35] bg-[#FFF3ED]"
                        : "border-[#D1D5DB] bg-white",
                    )}
                  >
                    {previewUrl && selectedFile ? (
                      <div>
                        <img
                          src={previewUrl}
                          alt="Pratinjau bukti pembayaran"
                          className="mx-auto max-h-32 max-w-full rounded-lg object-contain ring-1 ring-[#E5E7EB]"
                        />
                        <p className="mt-1.5 truncate text-[11px] font-medium text-[#1A1A1A] sm:text-xs">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-[#6B7280] sm:text-[11px]">
                          {formatFileSize(selectedFile.size)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => inputRef.current?.click()}
                          className="mt-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                        >
                          Ganti file
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35] ring-1 ring-[#FFE1D2]">
                          <UploadCloud size={19} aria-hidden="true" />
                        </span>
                        <p className="mt-1.5 text-xs font-semibold text-[#1A1A1A] sm:text-[13px]">
                          Seret & lepas bukti di sini
                        </p>
                        <p className="text-[10px] text-[#6B7280]">atau</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => inputRef.current?.click()}
                          className="mt-1.5 bg-white text-xs"
                        >
                          Pilih file
                        </Button>
                        <p className="mt-1.5 text-[10px] text-[#6B7280] sm:text-[11px]">
                          JPG, PNG, atau WEBP · maks. 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadError ? (
                    <p
                      role="alert"
                      className="mt-1.5 text-[11px] leading-relaxed text-[#B91C1C] sm:text-xs"
                    >
                      {uploadError}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    onClick={() => void handleUpload()}
                    disabled={!selectedFile || isUploading}
                    className="mt-2.5 h-10 w-full rounded-lg bg-[#FF6B35] font-semibold text-[#21140D] hover:bg-[#F25C26] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
                  >
                    {isUploading ? (
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="mr-1.5 animate-spin"
                      />
                    ) : (
                      <UploadCloud
                        size={16}
                        aria-hidden="true"
                        className="mr-1.5"
                      />
                    )}
                    {isUploading ? "Mengunggah..." : "Kirim bukti pembayaran"}
                  </Button>
                </>
              )}

              {!canUpload && !showProofSummary ? (
                <p className="mt-2.5 text-[11px] text-[#6B7280] sm:text-xs">
                  Status pesanan ini tidak menerima unggahan bukti baru.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                render={
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      whatsappMessage,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                className="h-10 w-full rounded-lg bg-[#25D366] font-semibold text-[#071C12] hover:bg-[#1FBD5A]"
              >
                <MessageCircle
                  size={16}
                  aria-hidden="true"
                  className="mr-1.5"
                />
                {whatsappLabel}
              </Button>

              <Button
                variant="ghost"
                render={<Link to="/katalog" />}
                className="h-9 w-full rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
              >
                <ShoppingBag size={15} aria-hidden="true" className="mr-1.5" />
                Kembali Belanja
              </Button>
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
