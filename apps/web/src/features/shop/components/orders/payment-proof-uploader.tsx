"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { cn } from "cn";
import type { OrderStatus } from "@delysa/shared";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { uploadPaymentProof } from "~/features/checkout/api/endpoints";
import {
  getPaymentProofError,
  PAYMENT_PROOF_ACCEPT,
  formatFileSize,
} from "~/features/checkout/lib/payment-proof";

export function PaymentProofUploader({
  orderId,
  status,
  onStatusChange,
  description = "Unggah bukti pembayaran agar pesanan segera diverifikasi.",
  className,
}: {
  orderId: number;
  status: OrderStatus;
  onStatusChange?: (status: OrderStatus) => void;
  description?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  if (status !== "pending_payment" && status !== "pending_verification") {
    return null;
  }

  const showProofSummary =
    Boolean(uploadedFile) || status === "pending_verification";
  const canUpload = status === "pending_payment";

  const selectFile = (file: File) => {
    const error = getPaymentProofError(orderId, file);
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

    const error = getPaymentProofError(orderId, selectedFile);
    if (error) {
      setUploadError(error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const updatedOrder = await uploadPaymentProof(orderId, selectedFile);
      onStatusChange?.(updatedOrder.status);
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
    <div
      className={cn(
        "rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 sm:p-4",
        className,
      )}
    >
      <div>
        <p className="text-xs font-bold text-[#1A1A1A] sm:text-[13px]">
          Upload bukti pembayaran
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">
          {description}
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
                {uploadedFile ? ` · ${formatFileSize(uploadedFile.size)}` : ""}
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
              <UploadCloud size={16} aria-hidden="true" className="mr-1.5" />
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
  );
}
