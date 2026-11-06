import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link, useParams } from "@tanstack/react-router";
import { AdminOrderAtelierStepper } from "../components/pesanan/admin-order-atelier-stepper";
import { OrderItemsCard } from "~/features/shop/components/orders/order-items-card";
import { OrderPaymentCard } from "~/features/shop/components/orders/order-payment-card";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { OrderStatusTimeline } from "~/features/shop/components/orders/order-status-timeline";
import { CopyOrderCodeButton } from "~/features/shop/components/orders/copy-order-code-button";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { formatRelativeAge } from "../lib/pesanan/admin-order-format";
import { useOrder } from "~/features/shop/hooks/use-orders";
import { cn } from "cn";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

export function AdminOrderDetailPage() {
  const { orderId } = useParams({ from: "/_admin/admin/pesanan/$orderId" });
  const order = useOrder(orderId) as AdminOrderView | undefined;

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 text-center">
        <LoaderCircle className="mb-4 h-6 w-6 animate-spin text-[#6B7280]" />
        <h2 className="text-lg font-semibold text-[#111111]">
          Order tidak ditemukan
        </h2>
        <p className="mt-2 text-xs text-[#6B7280]">
          Pesanan dengan kode <span className="font-mono">{orderId}</span> tidak
          tersedia.
        </p>
        <Link
          to="/admin/pesanan"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#C2410C] shadow-sm hover:bg-[#FFF3ED] transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Kembali ke daftar pesanan
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#111111]">
                {order.code}
              </span>
              <CopyOrderCodeButton
                code={order.code}
                className="size-6 text-[#6B7280] hover:text-[#111111]"
              />
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#6B7280]">
              <span className="text-[#9CA3AF]">Dipesan:</span>{" "}
              {formatOrderDate(order.createdAt)} WIB
            </p>
            <div className="mt-2 flex gap-1">
              <Link
                to="/admin/pesanan/$orderId"
                params={{ orderId: order.code }}
                className="rounded-lg bg-[#FFF3ED] px-3 py-1 text-xs font-semibold text-[#C2410C] hover:bg-[#FEE2E2] transition-colors"
              >
                Lihat detail ulang
              </Link>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-[#111111]">
              {order.totals.grandTotal.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
              })}
            </p>
            <p className="text-xs text-[#6B7280]">Total tagihan</p>
          </div>
        </div>
      </div>

      {/* Grid kiri-kanan */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom kiri: informasi & transfer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Pemesan */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <Mail size={13} aria-hidden="true" />
              <span>Informasi Pemesan</span>
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {order.recipientName}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {order.recipientPhone}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText(order.recipientPhone, "Nomor telepon")
                  }
                  className="shrink-0 rounded-full px-2.5 text-xs"
                >
                  Salin
                </Button>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Alamat Pengiriman
                </p>
                <p className="mt-0.5 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563]">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          </section>

          {/* Lokasi & Jadwal Antar */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <span>Lokasi &amp; Jadwal Antar</span>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  Gedung Rektorat UNSIL Lantai 2
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  Kampus Mugsari, Kota Tasikmalaya, Jawa Barat
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Kurir
                </p>
                <p className="mt-0.5 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563]">
                  Kurir Atelier Internal Tasikmalaya
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Estimasi
                </p>
                <p className="mt-0.5 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563]">
                  {formatRelativeAge(new Date(), order.createdAt)} sejak dipesan
                </p>
              </div>
            </div>
          </section>

          {/* Instruksi Pengantaran */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <span>Instruksi Pengantaran</span>
            </div>
            <div className="mt-3 rounded-xl border border-[#FFF3ED] bg-[#FFF7F2] p-4 text-[11px] leading-relaxed text-[#9A3412]">
              "Harap tibia sebelum pukul 11:30 WIB tepat di lobby rektorat
              sebelum proses foto senat selesai. Konfirmasi ke WA driver saat
              meluncur."
            </div>
          </section>

          {/* Inspeksi Bukti Transfer */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
                <span>Inspeksi Bukti Transfer</span>
              </div>
              <span className="text-[10px] font-medium text-[#6B7280]">
                m-BCA Electronic Slip
              </span>
            </div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 aspect-square">
                <p className="text-[10px] text-[#6B7280] text-center">
                  Bukti transfer ditampilkan di sini
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Rekening</dt>
                  <dd className="font-mono font-semibold text-[#1A1A1A]">
                    054-082-9912 (BCA)
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Atas Nama</dt>
                  <dd className="font-semibold text-[#1A1A1A]">KARTINAH</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Waktu</dt>
                  <dd className="font-semibold text-[#1A1A1A]">
                    26/10/2024 09:22:14 WIB
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Transaksi</dt>
                  <dd className="font-semibold text-[#1A1A1A]">Rp 740.000</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">No. Referensi</dt>
                  <dd className="font-mono font-semibold text-[#1A1A1A]">
                    MBC-988410294
                  </dd>
                </div>
              </dl>
              <div className="mt-3 rounded-xl border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-[#6B7280]">
                    Nominal Resi vs Tagihan
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                    COCOK 100%
                  </span>
                </div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
                  Rp 740.000
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
              >
                Tolak Pembayaran…
              </Button>
            </div>
          </section>
        </div>

        {/* Kolom kanan: status & item */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Pemenuhan Atelier */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
                <span>Status Pemenuhan Atelier</span>
              </div>
              <span className="text-[10px] font-medium text-[#6B7280]">
                Step 1 dari 4
              </span>
            </div>
            <AdminOrderAtelierStepper status={order.status} />
          </section>

          {/* Item Komposisi Floral */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <span>Item Komposisi Floral</span>
              <span className="text-[10px] font-medium text-[#6B7280]">
                {order.totals.itemCount ?? order.items.length} ITEM PRODUK
              </span>
            </div>
            <OrderItemsCard order={order} />
          </section>

          {/* Konfirmasi Penolakan Pembayaran */}
          {order.status === "rejected" && (
            <section className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#B91C1C] uppercase">
                <span>Konfirmasi Penolakan Pembayaran</span>
                <span className="text-[10px] font-medium text-[#B91C1C]">
                  TINDAKAN SENSITIF
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="alasan"
                    className="accent-[#B91C1C]"
                  />
                  <span className="text-xs text-[#4B5563]">
                    Nominal tidak sesuai
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="alasan"
                    className="accent-[#B91C1C]"
                  />
                  <span className="text-xs text-[#4B5563]">
                    Bukti transfer buruan/palsu
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="alasan"
                    className="accent-[#B91C1C]"
                  />
                  <span className="text-xs text-[#4B5563]">
                    Lainnya (Tuliskan catatan)
                  </span>
                </label>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Catatan Notifikasi Pelanggan (Dikirim via WhatsApp/Email)
                </p>
                <textarea
                  className="w-full rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20"
                  rows={4}
                  placeholder="Halo dr. Amelia, mohon maaf mutasi m-BCA atas nama pengirim belum terdeteksi pada rekening atelier kami per pukul 09.30 WIB..."
                ></textarea>
              </div>
              <div className="mt-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs leading-relaxed text-[#991B1B]">
                ⚠️ Perhatian: Menolak pembayaran akan membatalkan reservasi slot
                bunga dan stok material bunga otomatis dikembalikan ke
                inventaris atelier.
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg px-3 text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-lg px-3 text-xs font-semibold"
                >
                  Konfirmasi Tolak &amp; Kembalikan Stok
                </Button>
              </div>
            </section>
          )}

          {/* Total Tagihan Final */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-end justify-between gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <span>Total Tagihan Final</span>
            </div>
            <div className="mt-3 text-right">
              <p className="text-3xl font-extrabold tracking-tight text-[#111111]">
                {order.totals.grandTotal.toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                })}
              </p>
            </div>
          </section>

          {/* Jejak Audit & Log Transaksi */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
              <span>Jejak Audit &amp; Log Transaksi</span>
              <span className="text-[10px] font-medium text-[#6B7280]">
                IMMUTABLE LOG
              </span>
            </div>
            <OrderStatusTimeline
              events={order.timeline}
              status={order.status}
            />
          </section>

          {/* Kartu Ucapan Custom */}
          {order.customNote && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#FF6B35] uppercase">
                <span>Kartu Ucapan Custom</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full px-2 text-[10px] font-semibold"
                >
                  Salin Teks
                </Button>
              </div>
              <div className="mt-3 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-4 text-sm leading-relaxed text-[#1A1A1A]">
                “{order.customNote}”
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-[#6B7280]">
                <span>Dari: Keluarga Besar &amp; Kolegas</span>
                <span>Pilihan Kartu: Embossed Ivory Linen</span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper salin teks (tidak bergantung komponen shop agar halaman admin mandiri)
function copyText(value: string, label: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(value)
    .then(() => true)
    .catch(() => false);
}
