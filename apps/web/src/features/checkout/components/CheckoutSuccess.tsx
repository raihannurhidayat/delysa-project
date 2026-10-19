"use client";

import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  MessageCircle,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import type { OrderResponse } from "../api/endpoints";

interface CheckoutSuccessProps {
  order: OrderResponse;
  proofError: string | null;
}

export function CheckoutSuccess({ order, proofError }: CheckoutSuccessProps) {
  return (
    <section
      aria-labelledby="checkout-success-heading"
      className="mx-auto max-w-xl text-center"
    >
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} aria-hidden="true" />
        </span>

        <h1
          id="checkout-success-heading"
          className="mt-4 text-xl font-extrabold tracking-tight text-[#1A1A1A]"
        >
          Pesanan Berhasil Dibuat
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Simpan kode pesanan berikut untuk konfirmasi pembayaran.
        </p>

        <p className="mt-4 rounded-xl bg-[#F8F9FA] px-4 py-3 font-mono text-base font-bold tracking-wide text-[#1A1A1A]">
          {order.code}
        </p>

        <dl className="mt-4 space-y-2 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Status</dt>
            <dd className="font-semibold text-[#1A1A1A]">
              Menunggu Pembayaran
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6B7280]">Total</dt>
            <dd className="font-semibold text-[#1A1A1A]">
              {formatIDR(order.total)}
            </dd>
          </div>
        </dl>

        {proofError ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800">
            Pesanan berhasil dibuat, tetapi bukti transfer gagal diunggah:{" "}
            {proofError}. Kirim bukti via WhatsApp admin dengan menyertakan kode
            pesanan.
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3 text-left text-xs text-[#6B7280]">
            Lanjutkan transfer manual BCA, lalu unggah bukti agar pesanan
            diverifikasi. Belum transfer? Konfirmasi nomor rekening via WhatsApp
            admin.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button
            render={
              <a
                href={`https://wa.me/6282116789558?text=${encodeURIComponent(
                  `Halo Delysa Florist, saya sudah membuat pesanan ${order.code} sebesar ${formatIDR(order.total)}. Mohon info nomor rekening BCA dan konfirmasi pembayaran.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            className="w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <MessageCircle size={16} aria-hidden="true" className="mr-1.5" />
            Konfirmasi via WhatsApp
          </Button>
          <Button
            variant="outline"
            render={<Link to="/katalog" />}
            className="w-full rounded-full"
          >
            <ShoppingBag size={16} aria-hidden="true" className="mr-1.5" />
            Kembali Belanja
          </Button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-[#9CA3AF]">
          <Package size={12} aria-hidden="true" />
          Lacak status pesanan dari halaman riwayat pesanan (segera hadir).
        </p>
      </div>
    </section>
  );
}
