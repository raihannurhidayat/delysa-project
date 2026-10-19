"use client";

import { useFormContext } from "react-hook-form";
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { formatIDR } from "~/features/shop/lib/format";
import type { CartTotals } from "~/features/shop/lib/cart-totals";
import type { CartCoupon, MiniCartLine } from "~/features/shop/types";
import type { CheckoutFormData } from "../../schemas";

interface RingkasanStepProps {
  lines: MiniCartLine[];
  cartTotals: CartTotals;
  coupon: CartCoupon | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function RingkasanStep({
  lines,
  cartTotals,
  coupon,
  isSubmitting,
  onBack,
  onSubmit,
}: RingkasanStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();
  const confirmed = watch("confirmed");
  const recipientName = watch("recipientName");
  const recipientPhone = watch("recipientPhone");
  const shippingAddress = watch("shippingAddress");
  const customNote = watch("customNote");
  const paymentProof = watch("paymentProof");

  return (
    <section aria-labelledby="checkout-ringkasan-heading" className="space-y-4">
      <div>
        <h2
          id="checkout-ringkasan-heading"
          className="text-lg font-extrabold tracking-tight text-[#1A1A1A]"
        >
          Ringkasan & Bayar
        </h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Periksa kembali detail pesanan sebelum membuat pesanan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Penerima
          </p>
          <p className="mt-1 text-sm font-bold text-[#1A1A1A]">
            {recipientName || "-"}
          </p>
          <p className="text-xs text-[#6B7280]">{recipientPhone || "-"}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
            {shippingAddress || "-"}
          </p>
          {customNote && (
            <p className="mt-1 text-xs italic text-[#6B7280]">“{customNote}”</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Pembayaran
          </p>
          <p className="mt-1 text-sm font-bold text-[#1A1A1A]">
            Transfer Manual BCA
          </p>
          <p className="text-xs text-[#6B7280]">a.n. Kartinah</p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {paymentProof
              ? `Bukti: ${paymentProof.file.name} (diunggah setelah order dibuat)`
              : "Bukti transfer belum dipilih — bisa diunggah setelah order dibuat."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <p className="text-sm font-bold text-[#1A1A1A]">
          Item ({cartTotals.itemCount})
        </p>
        <ul className="mt-2 divide-y divide-[#E5E7EB]">
          {lines.map((line) => (
            <li
              key={`${line.kind ?? "product"}:${line.slug}:${line.sizeId}:${line.wrapId}`}
              className="flex items-center gap-3 py-2"
            >
              <img
                src={line.image}
                alt=""
                className="size-12 shrink-0 rounded-md border border-[#E5E7EB] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1A1A1A]">
                  {line.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {line.sizeLabel} · {line.qty}×
                </p>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">
                {formatIDR(line.price * line.qty)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-[#E5E7EB] pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Subtotal</dt>
            <dd className="font-medium text-[#1A1A1A]">
              {formatIDR(cartTotals.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Ongkos kirim</dt>
            <dd className="font-medium text-[#1A1A1A]">
              {cartTotals.freeShipping
                ? "GRATIS"
                : formatIDR(cartTotals.shipping)}
            </dd>
          </div>
          {coupon && coupon.amount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Kupon {coupon.code}</dt>
              <dd className="font-medium">−{formatIDR(coupon.amount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[#E5E7EB] pt-2">
            <dt className="text-base font-extrabold text-[#1A1A1A]">
              Total Akhir
            </dt>
            <dd className="text-base font-extrabold text-[#1A1A1A]">
              {formatIDR(cartTotals.grandTotal)}
            </dd>
          </div>
        </dl>
      </div>

      <Field data-invalid={!!errors.confirmed}>
        <FieldLabel
          htmlFor="checkout-confirm"
          className="items-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm font-normal text-[#1A1A1A]"
        >
          <Checkbox
            id="checkout-confirm"
            checked={confirmed}
            onCheckedChange={(checked) =>
              setValue("confirmed", checked === true, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            aria-invalid={!!errors.confirmed}
            className="mt-0.5"
          />
          <span>
            Saya sudah memeriksa data penerima, alamat, dan total pembayaran.
            Pesanan akan dibuat dengan status{" "}
            <span className="font-semibold">menunggu pembayaran</span>.
          </span>
        </FieldLabel>
        <FieldError errors={[errors.confirmed]} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-full text-[#6B7280] hover:bg-[#F3F4F6]"
        >
          <ArrowLeft size={16} aria-hidden="true" className="mr-1" />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !confirmed}
          aria-busy={isSubmitting}
          className="rounded-full bg-[#111111] text-white hover:bg-[#2A2A2A] disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF]"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={16}
                className="mr-1.5 animate-spin"
                aria-hidden="true"
              />
              Membuat Pesanan…
            </>
          ) : (
            <>
              <Lock size={16} aria-hidden="true" className="mr-1.5" />
              Buat Pesanan
            </>
          )}
        </Button>
      </div>

      <ul
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#6B7280]"
        aria-label="Jaminan keamanan"
      >
        <li className="flex items-center gap-1">
          <ShieldCheck
            size={12}
            className="text-emerald-600"
            aria-hidden="true"
          />
          Pembayaran resmi a.n. Kartinah
        </li>
        <li className="flex items-center gap-1">
          <Truck size={12} className="text-emerald-600" aria-hidden="true" />
          Kirim area Tasikmalaya
        </li>
        <li className="flex items-center gap-1">
          <Check size={12} className="text-emerald-600" aria-hidden="true" />
          Konfirmasi foto sebelum kirim
        </li>
      </ul>
    </section>
  );
}
