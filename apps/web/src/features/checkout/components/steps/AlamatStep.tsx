"use client";

import { useFormContext } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field";
import type { CheckoutFormData } from "../../schemas";

interface AlamatStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function AlamatStep({ onBack, onNext }: AlamatStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();

  return (
    <section aria-labelledby="checkout-alamat-heading" className="space-y-4">
      <div>
        <h2
          id="checkout-alamat-heading"
          className="text-lg font-extrabold tracking-tight text-[#1A1A1A]"
        >
          Alamat Pengiriman
        </h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Kami hanya melayani pengiriman area Tasikmalaya radius 15 km.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <Field data-invalid={!!errors.recipientName}>
          <FieldLabel htmlFor="recipientName">
            Nama Penerima <span className="text-[#FF6B35]">*</span>
          </FieldLabel>
          <Input
            id="recipientName"
            autoComplete="name"
            placeholder="Contoh: Budi Santoso"
            aria-invalid={!!errors.recipientName}
            aria-describedby={
              errors.recipientName ? "recipientName-error" : undefined
            }
            className="rounded-lg border border-[#E5E7EB] bg-white"
            {...register("recipientName")}
          />
          <FieldError
            id="recipientName-error"
            errors={[errors.recipientName]}
          />
        </Field>

        <Field data-invalid={!!errors.recipientPhone}>
          <FieldLabel htmlFor="recipientPhone">
            Nomor HP/WhatsApp <span className="text-[#FF6B35]">*</span>
          </FieldLabel>
          <Input
            id="recipientPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Contoh: 081234567890"
            aria-invalid={!!errors.recipientPhone}
            aria-describedby={
              errors.recipientPhone ? "recipientPhone-error" : undefined
            }
            className="rounded-lg border border-[#E5E7EB] bg-white"
            {...register("recipientPhone")}
          />
          <FieldError
            id="recipientPhone-error"
            errors={[errors.recipientPhone]}
          />
        </Field>

        <Field data-invalid={!!errors.shippingAddress}>
          <FieldLabel htmlFor="shippingAddress">
            Alamat Lengkap <span className="text-[#FF6B35]">*</span>
          </FieldLabel>
          <Textarea
            id="shippingAddress"
            rows={3}
            autoComplete="street-address"
            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, patokan"
            aria-invalid={!!errors.shippingAddress}
            aria-describedby={
              errors.shippingAddress ? "shippingAddress-error" : undefined
            }
            className="rounded-lg border border-[#E5E7EB] bg-white"
            {...register("shippingAddress")}
          />
          <FieldError
            id="shippingAddress-error"
            errors={[errors.shippingAddress]}
          />
        </Field>

        <Field data-invalid={!!errors.customNote}>
          <FieldLabel htmlFor="customNote">
            Catatan untuk Kurir (opsional)
          </FieldLabel>
          <Textarea
            id="customNote"
            rows={2}
            placeholder="Contoh: Antar jam 10:00–11:00, titip ke resepsionis"
            aria-invalid={!!errors.customNote}
            aria-describedby={
              errors.customNote ? "customNote-error" : undefined
            }
            className="rounded-lg border border-[#E5E7EB] bg-white"
            {...register("customNote")}
          />
          <FieldDescription>Maksimal 500 karakter.</FieldDescription>
          <FieldError id="customNote-error" errors={[errors.customNote]} />
        </Field>
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
          Lanjut ke Pembayaran
          <ArrowRight size={16} aria-hidden="true" className="ml-1" />
        </Button>
      </div>
    </section>
  );
}
