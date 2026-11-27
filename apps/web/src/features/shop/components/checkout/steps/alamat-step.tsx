"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field";
import { cn } from "~/lib/utils";
import type { CheckoutFormData } from "~/features/shop/schemas/checkout-schema";

const DELIVERY_SLOTS = [
  { id: "pagi", label: "Pagi", range: "08.00–12.00 WIB" },
  { id: "siang", label: "Siang", range: "12.00–16.00 WIB" },
  { id: "sore", label: "Sore", range: "16.00–20.00 WIB" },
] as const;

function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface AlamatStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function AlamatStep({ onBack, onNext }: AlamatStepProps) {
  const {
    register,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();
  const buyerPhoneSameAsRecipient = watch("buyerPhoneSameAsRecipient") ?? true;
  const [deliveryDate, setDeliveryDate] = useState(todayISO);
  const [deliverySlot, setDeliverySlot] = useState<string>(
    DELIVERY_SLOTS[0].range,
  );

  const syncScheduleNote = (dateVal: string, slotVal: string) => {
    const prefix = `[Jadwal kirim: ${dateVal}, ${slotVal}]`;
    const current = (getValues("customNote") ?? "").trim();
    const cleaned = current.replace(/^\[Jadwal kirim:[^\]]+\]\s*/, "").trim();
    const nextNote = cleaned ? `${prefix} ${cleaned}` : prefix;
    setValue("customNote", nextNote.slice(0, 500), { shouldDirty: true });
  };

  return (
    <section aria-labelledby="checkout-alamat-heading" className="space-y-4">
      <div>
        <h2
          id="checkout-alamat-heading"
          className="text-lg font-extrabold tracking-tight text-[#1C1917]"
        >
          Alamat &amp; Jadwal Pengiriman
        </h2>
        <p className="mt-0.5 text-sm text-[#57534E]">
          Kami melayani pengantaran area Tasikmalaya radius 15 km dari Cikalang,
          Tawang.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#EAE2DE] bg-white p-4">
        <Field data-invalid={!!errors.recipientName}>
          <FieldLabel htmlFor="recipientName">
            Nama Penerima <span className="text-[#BE185D]">*</span>
          </FieldLabel>
          <Input
            id="recipientName"
            autoComplete="name"
            placeholder="Contoh: Budi Santoso"
            aria-invalid={!!errors.recipientName}
            aria-describedby={
              errors.recipientName ? "recipientName-error" : undefined
            }
            className="rounded-lg border border-[#D6CBC6] bg-white focus-visible:border-[#BE185D] focus-visible:ring-[#BE185D]/20"
            {...register("recipientName")}
          />
          <FieldError
            id="recipientName-error"
            errors={[errors.recipientName]}
          />
        </Field>

        <Field data-invalid={!!errors.recipientPhone}>
          <FieldLabel htmlFor="recipientPhone">
            Nomor HP/WhatsApp <span className="text-[#BE185D]">*</span>
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
            className="rounded-lg border border-[#D6CBC6] bg-white focus-visible:border-[#BE185D] focus-visible:ring-[#BE185D]/20"
            {...register("recipientPhone")}
          />
          <FieldError
            id="recipientPhone-error"
            errors={[errors.recipientPhone]}
          />
        </Field>

        <div className="rounded-lg border border-[#EAE2DE] bg-[#FAFAF9] p-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox
              id="buyerPhoneSameAsRecipient"
              checked={buyerPhoneSameAsRecipient}
              onCheckedChange={(checked) => {
                const isSame = checked === true;
                setValue("buyerPhoneSameAsRecipient", isSame, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                if (isSame) {
                  setValue("buyerPhone", getValues("recipientPhone"), {
                    shouldDirty: true,
                  });
                }
              }}
            />
            <span className="text-xs font-semibold text-[#1C1917]">
              Nomor WhatsApp pemesan sama dengan nomor penerima
            </span>
          </label>

          {!buyerPhoneSameAsRecipient && (
            <div className="mt-3 pt-3 border-t border-[#EAE2DE]">
              <Field data-invalid={!!errors.buyerPhone}>
                <FieldLabel htmlFor="buyerPhone">
                  Nomor HP/WhatsApp Pemesan (Pembeli){" "}
                  <span className="text-[#BE185D]">*</span>
                </FieldLabel>
                <Input
                  id="buyerPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Contoh: 081298765432"
                  aria-invalid={!!errors.buyerPhone}
                  aria-describedby={
                    errors.buyerPhone ? "buyerPhone-error" : undefined
                  }
                  className="rounded-lg border border-[#D6CBC6] bg-white focus-visible:border-[#BE185D] focus-visible:ring-[#BE185D]/20"
                  {...register("buyerPhone")}
                />
                <FieldDescription className="text-[11px] text-[#78716C]">
                  Nomor Anda untuk menerima konfirmasi pesanan dan update
                  pengiriman via WhatsApp.
                </FieldDescription>
                <FieldError
                  id="buyerPhone-error"
                  errors={[errors.buyerPhone]}
                />
              </Field>
            </div>
          )}
        </div>

        <Field data-invalid={!!errors.shippingAddress}>
          <FieldLabel htmlFor="shippingAddress">
            Alamat Lengkap <span className="text-[#BE185D]">*</span>
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
            className="rounded-lg border border-[#D6CBC6] bg-white focus-visible:border-[#BE185D] focus-visible:ring-[#BE185D]/20"
            {...register("shippingAddress")}
          />
          <FieldError
            id="shippingAddress-error"
            errors={[errors.shippingAddress]}
          />
        </Field>

        <div className="rounded-xl border border-[#FBCFE8] bg-[#FDF2F8]/50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#9D174D]">
            <Calendar size={14} aria-hidden="true" />
            Pilih Tanggal &amp; Slot Jam Pengiriman
          </p>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-[180px_1fr]">
            <div>
              <label
                htmlFor="delivery-date"
                className="mb-1 block text-[11px] font-semibold text-[#57534E]"
              >
                Tanggal Kirim
              </label>
              <Input
                id="delivery-date"
                type="date"
                min={todayISO()}
                value={deliveryDate}
                onChange={(event) => {
                  const val = event.target.value;
                  setDeliveryDate(val);
                  if (val) syncScheduleNote(val, deliverySlot);
                }}
                className="h-10 rounded-lg border-[#D6CBC6] bg-white text-xs"
              />
            </div>
            <div>
              <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#57534E]">
                <Clock size={12} aria-hidden="true" />
                Slot Waktu Antar
              </span>
              <div
                role="radiogroup"
                aria-label="Slot waktu pengantaran"
                className="grid grid-cols-3 gap-1.5"
              >
                {DELIVERY_SLOTS.map((slot) => {
                  const active = deliverySlot === slot.range;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setDeliverySlot(slot.range);
                        syncScheduleNote(deliveryDate, slot.range);
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]",
                        active
                          ? "border-[#BE185D] bg-[#BE185D] text-white"
                          : "border-[#EAE2DE] bg-white text-[#1C1917] hover:border-[#FBCFE8] hover:bg-[#FDF2F8]",
                      )}
                    >
                      <span className="block text-[11px] font-bold">
                        {slot.label}
                      </span>
                      <span
                        className={cn(
                          "block text-[10px]",
                          active ? "text-white/90" : "text-[#57534E]",
                        )}
                      >
                        {slot.range.replace(" WIB", "")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Field data-invalid={!!errors.customNote}>
          <FieldLabel htmlFor="customNote">
            Catatan untuk Kurir / Kustom Buket (opsional)
          </FieldLabel>
          <Textarea
            id="customNote"
            rows={2}
            placeholder="Contoh: Titip ke resepsionis, warna pita pink pastel, atau kalimat kartu ucapan"
            aria-invalid={!!errors.customNote}
            aria-describedby={
              errors.customNote ? "customNote-error" : undefined
            }
            className="rounded-lg border border-[#D6CBC6] bg-white focus-visible:border-[#BE185D] focus-visible:ring-[#BE185D]/20"
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
          className="rounded-full text-[#57534E] hover:bg-[#FDF2F8] hover:text-[#9D174D]"
        >
          <ArrowLeft size={16} aria-hidden="true" className="mr-1" />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#BE185D] text-white hover:bg-[#9D174D]"
        >
          Lanjut ke Pembayaran
          <ArrowRight size={16} aria-hidden="true" className="ml-1" />
        </Button>
      </div>
    </section>
  );
}
