"use client";

import { useFormContext } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Landmark,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "~/components/ui/toast";
import { formatIDR } from "~/features/shop/lib/format";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import {
  getPaymentMethod,
  PAYMENT_METHOD_ITEMS,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
} from "../../payment-methods";
import { isPaymentMethod } from "../../types";
import type { CheckoutFormData } from "../../schemas";

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
  const paymentMethod = watch("paymentMethod");
  const method = getPaymentMethod(paymentMethod);
  const totalLabel = formatIDR(cartTotals.grandTotal);

  const handleCopyAccount = async () => {
    if (!method?.bank) return;

    try {
      await navigator.clipboard.writeText(method.bank.accountNumber);
      toast.add({ title: "Nomor rekening disalin", type: "success" });
    } catch {
      toast.add({
        title: "Gagal menyalin",
        description: "Salin nomor rekening secara manual.",
        type: "error",
      });
    }
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
          Pilih metode pembayaran untuk melihat instruksi yang perlu dilakukan.
        </p>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <Field data-invalid={!!errors.paymentMethod}>
          <FieldLabel htmlFor="payment-method">
            Metode Pembayaran <span className="text-[#FF6B35]">*</span>
          </FieldLabel>
          <Select
            value={paymentMethod || null}
            onValueChange={(value) => {
              if (isPaymentMethod(value)) {
                setValue("paymentMethod", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
            items={PAYMENT_METHOD_ITEMS}
          >
            <SelectTrigger
              id="payment-method"
              aria-invalid={!!errors.paymentMethod}
              aria-describedby={
                errors.paymentMethod ? "payment-method-error" : undefined
              }
              className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm"
            >
              <SelectValue placeholder="Pilih metode pembayaran" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} sideOffset={8}>
              {PAYMENT_METHOD_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            id="payment-method-error"
            errors={[errors.paymentMethod]}
          />
        </Field>

        <div aria-live="polite">
          {method && (
            <div
              data-testid="payment-instructions"
              className="mt-4 border-t border-[#E5E7EB] pt-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                  {method.bank ? (
                    <Landmark size={20} aria-hidden="true" />
                  ) : (
                    <QrCode size={20} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {method.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {method.description}
                  </p>
                </div>
              </div>

              {method.bank && (
                <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                        Rekening {method.bank.name}
                      </p>
                      <p className="mt-1 font-mono text-lg font-extrabold tracking-wide text-[#1A1A1A]">
                        {method.bank.accountNumber}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        a.n. {method.bank.accountName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyAccount()}
                      className="shrink-0 rounded-full"
                    >
                      <Copy size={14} aria-hidden="true" className="mr-1" />
                      Salin
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-semibold text-[#1A1A1A]">
                  Langkah pembayaran
                </p>
                <ol className="mt-2 space-y-2">
                  {method.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex gap-2 text-xs leading-relaxed text-[#6B7280]"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FFF3ED] text-[11px] font-bold text-[#FF6B35]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <dl className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6B7280]">Total yang harus dibayar</dt>
                  <dd className="text-base font-extrabold text-[#1A1A1A]">
                    {totalLabel}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6B7280]">Batas konfirmasi</dt>
                  <dd className="font-medium text-[#1A1A1A]">1×24 jam</dd>
                </div>
              </dl>

              {method.ctaLabel && method.whatsappMessage ? (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    method.whatsappMessage(totalLabel),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageCircle size={14} aria-hidden="true" />
                  {method.ctaLabel}
                </a>
              ) : null}
            </div>
          )}
        </div>
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
