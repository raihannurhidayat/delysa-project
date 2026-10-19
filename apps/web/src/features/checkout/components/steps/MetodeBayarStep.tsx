"use client";

import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  MessageCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { formatIDR } from "~/features/shop/lib/format";
import { toast } from "~/components/ui/toast";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import {
  ALLOWED_PROOF_TYPES,
  MAX_PROOF_BYTES,
  type CheckoutFormData,
} from "../../schemas";

const WHATSAPP_NUMBER = "6282116789558";

interface MetodeBayarStepProps {
  cartTotals: CartTotals;
  onBack: () => void;
  onNext: () => void;
}

export function MetodeBayarStep({
  cartTotals,
  onBack,
  onNext,
}: MetodeBayarStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();
  const paymentProof = watch("paymentProof");
  const previewUrl = paymentProof?.preview;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!(ALLOWED_PROOF_TYPES as readonly string[]).includes(file.type)) {
      toast.add({
        title: "Format tidak didukung",
        description: "Hanya JPG, PNG, atau WEBP yang diterima.",
        type: "error",
      });
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.add({
        title: "File terlalu besar",
        description: "Ukuran maksimal 5 MB.",
        type: "error",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setValue(
      "paymentProof",
      { file, preview: URL.createObjectURL(file) },
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const handleRemoveProof = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setValue("paymentProof", null, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <section aria-labelledby="checkout-bayar-heading" className="space-y-4">
      <div>
        <h2
          id="checkout-bayar-heading"
          className="text-lg font-extrabold tracking-tight text-[#1A1A1A]"
        >
          Metode Pembayaran
        </h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Transfer manual BCA, lalu unggah bukti pembayaran.
        </p>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
            <MessageCircle size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#1A1A1A]">
              Transfer Manual BCA
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              a.n. Kartinah — konfirmasi nomor rekening via WhatsApp admin
              sebelum transfer.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Halo Delysa Florist, mohon info nomor rekening BCA untuk pembayaran pesanan saya sebesar ${formatIDR(cartTotals.grandTotal)}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <MessageCircle size={14} aria-hidden="true" />
              Chat Admin (082116789558)
            </a>
          </div>
        </div>

        <dl className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-[#6B7280]">Total yang harus dibayar</dt>
            <dd className="text-base font-extrabold text-[#1A1A1A]">
              {formatIDR(cartTotals.grandTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[#6B7280]">Batas konfirmasi</dt>
            <dd className="font-medium text-[#1A1A1A]">1×24 jam</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <p className="text-sm font-bold text-[#1A1A1A]">
          Bukti Transfer (opsional sekarang)
        </p>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          Kamu bisa mengunggah bukti sekarang, atau menyusul dari halaman
          pesanan setelah order dibuat. Format JPG/PNG/WEBP maksimal 5 MB.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_PROOF_TYPES.join(",")}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Pilih file bukti transfer"
        />

        {paymentProof ? (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-2">
            <img
              src={paymentProof.preview}
              alt="Pratinjau bukti transfer"
              className="size-16 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1A1A1A]">
                {paymentProof.file.name}
              </p>
              <p className="text-xs text-[#6B7280]">
                {(paymentProof.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRemoveProof}
              aria-label="Hapus bukti transfer"
              className="rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full rounded-full border-dashed border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
          >
            <Upload size={16} aria-hidden="true" className="mr-1.5" />
            Pilih File Bukti Transfer
          </Button>
        )}

        {errors.paymentProof && (
          <Alert variant="destructive" className="mt-3">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            <AlertTitle className="text-xs font-medium">
              File tidak valid
            </AlertTitle>
            <AlertDescription className="text-xs">
              {errors.paymentProof.message}
            </AlertDescription>
          </Alert>
        )}

        {paymentProof && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700">
            <CheckCircle2 size={12} aria-hidden="true" />
            File siap diunggah setelah pesanan dibuat.
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
        >
          <ArrowLeft size={16} aria-hidden="true" className="mr-1" />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A]"
        >
          Lanjut ke Ringkasan
          <ArrowRight size={16} aria-hidden="true" className="ml-1" />
        </Button>
      </div>
    </section>
  );
}
