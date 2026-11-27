import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  Flower2,
  History,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareQuote,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Truck,
} from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  AdminOrderAtelierStepper,
  atelierStepIndex,
} from "../components/pesanan/admin-order-atelier-stepper";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { OrderStatusTimeline } from "~/features/shop/components/orders/order-status-timeline";
import { CopyOrderCodeButton } from "~/features/shop/components/orders/copy-order-code-button";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { updateOrderStatus } from "~/features/shop/lib/order-store";
import { useOrder } from "~/features/shop/hooks/use-orders";
import { useAdminOrderActions } from "../hooks/use-admin-order-actions";
import { enrichAdminOrder } from "../lib/pesanan/admin-order-enrichment";
import { formatRelativeAge } from "../lib/pesanan/admin-order-format";
import {
  getAdminOrderActions,
  type AdminOrderActionId,
} from "../lib/pesanan/admin-order-transition";
import { cn } from "cn";

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams({ from: "/_admin/admin/pesanan/$orderId" });
  const rawOrder = useOrder(orderId);
  const order = useMemo(
    () => (rawOrder ? enrichAdminOrder(rawOrder) : undefined),
    [rawOrder],
  );
  const { applyAction } = useAdminOrderActions();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectReason, setRejectReason] = useState("Nominal tidak sesuai");
  const [rejectNote, setRejectNote] = useState("");

  if (!order) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <LoaderCircle className="mb-4 h-7 w-7 animate-spin text-[#BE185D]" />
        <h2 className="text-lg font-bold text-[#111111]">
          Order tidak ditemukan
        </h2>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#6B7280]">
          Pesanan dengan kode{" "}
          <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono font-semibold text-[#111111]">
            {orderId}
          </span>{" "}
          tidak tersedia di penyimpanan pesanan.
        </p>
        <Link
          to="/admin/pesanan"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#9D174D] shadow-xs transition-colors hover:bg-[#FDF2F8]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Kembali ke daftar pesanan
        </Link>
      </div>
    );
  }

  const availableActions = getAdminOrderActions(order.status);
  const currentStep = Math.min(atelierStepIndex(order.status) + 1, 4);
  const itemCount =
    order.totals.itemCount ??
    order.items.reduce((sum, item) => sum + item.qty, 0);

  const addressSegments = order.shippingAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const primaryLocation =
    addressSegments[0] ?? "Gedung Rektorat UNSIL Lantai 2";
  const secondaryLocation =
    addressSegments.slice(1).join(", ") ||
    "Kampus Mugarsari, Kota Tasikmalaya, Jawa Barat";

  const bankAccountDisplay = order.payment.bank
    ? `${order.payment.bank.accountNumber} (${order.payment.bank.name})`
    : "054-082-9912 (BCA)";
  const bankHolderDisplay = (
    order.payment.bank?.accountName ?? "KARTINAH"
  ).toUpperCase();
  const referenceNumber = `MBC-${order.code.replace(/[^A-Z0-9]/gi, "").slice(-8)}`;

  function handleCopy(text: string, key: string) {
    void copyText(text).then((ok) => {
      if (ok) {
        setCopiedKey(key);
        setTimeout(() => {
          setCopiedKey((prev) => (prev === key ? null : prev));
        }, 1800);
      }
    });
  }

  function handleAction(actionId: AdminOrderActionId) {
    if (!order) return;
    if (actionId === "reject") {
      setShowRejectPanel(true);
      return;
    }
    applyAction(order, actionId);
  }

  function handleConfirmReject() {
    if (!order) return;
    const detail = rejectNote.trim()
      ? `${rejectReason} — ${rejectNote.trim()}`
      : rejectReason;
    updateOrderStatus(order.code, "rejected", {
      note: `Ditolak admin: ${detail}`,
    });
    setShowRejectPanel(false);
  }

  return (
    <div className="min-w-0 space-y-5">
      {/* Top Bar Navigasi & Chip Konteks */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/pesanan"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#4B5563] shadow-2xs transition-colors hover:border-[#BE185D]/40 hover:bg-[#FDF2F8] hover:text-[#9D174D]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Kembali ke daftar pesanan
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          {order.batch === "unsil" && (
            <Badge className="rounded-full border border-[#FED7AA] bg-[#FDF2F8] px-2.5 py-0.5 text-[11px] font-semibold text-[#9D174D]">
              Batch Wisuda UNSIL
            </Badge>
          )}
          {order.priority === "prioritas" && (
            <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              Prioritas SLA
            </Badge>
          )}
          {order.slaBreached && (
            <Badge className="rounded-full border border-rose-200 bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-semibold text-[#B91C1C]">
              SLA Lewat Batas
            </Badge>
          )}
          {order.workbench && (
            <Badge className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#4B5563]">
              {order.workbench}
            </Badge>
          )}
          {order.courierLabel && (
            <Badge className="rounded-full border border-emerald-200 bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#166534]">
              {order.courierLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Header Ringkasan Order */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-lg font-extrabold tracking-tight text-[#111111] sm:text-xl">
                {order.code}
              </h1>
              <CopyOrderCodeButton
                code={order.code}
                className="size-7 text-[#6B7280] hover:text-[#111111]"
              />
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock
                  size={13}
                  className="text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <span className="text-[#9CA3AF]">Dipesan:</span>{" "}
                <strong className="font-medium text-[#374151]">
                  {formatOrderDate(order.createdAt)}
                </strong>
              </span>
              <span className="hidden text-[#D1D5DB] sm:inline">•</span>
              <span>
                <span className="text-[#9CA3AF]">Batas bayar:</span>{" "}
                <strong className="font-medium text-[#374151]">
                  {formatOrderDate(order.paymentDeadline)}
                </strong>
              </span>
              <span className="hidden text-[#D1D5DB] sm:inline">•</span>
              <span>
                <span className="text-[#9CA3AF]">Metode:</span>{" "}
                <strong className="font-medium text-[#374151]">
                  {order.payment.label || "Transfer Manual BCA"}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#F3F4F6] pt-3 sm:flex-row sm:items-center sm:justify-between lg:border-t-0 lg:pt-0 lg:text-right">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                Total Tagihan
              </p>
              <p className="text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl">
                {formatRupiah(order.totals.grandTotal)}
              </p>
            </div>

            {availableActions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 lg:pl-2">
                {availableActions.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant={
                      action.variant === "destructive"
                        ? "destructive"
                        : "default"
                    }
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      "rounded-xl px-3.5 text-xs font-semibold",
                      action.variant !== "destructive" &&
                        "bg-[#BE185D] text-white hover:bg-[#9D174D]",
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baris 1: Status Pemenuhan Atelier (Full Width Row) */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
            <PackageCheck size={13} aria-hidden="true" />
            <span>Status Pemenuhan Atelier</span>
          </div>
          <Badge className="rounded-full border border-[#FED7AA] bg-[#FDF2F8] px-2.5 py-0.5 text-[10px] font-bold text-[#9D174D]">
            Step {currentStep} dari 4
          </Badge>
        </div>
        <AdminOrderAtelierStepper status={order.status} />
      </section>

      {/* Baris 2: Pemesan, Lokasi & Jadwal Antar, dan Instruksi (3-Kolom Row) */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Informasi Pemesan */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                <Mail size={13} aria-hidden="true" />
                <span>Informasi Pemesan</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(order.recipientPhone, "phone")}
                className="h-7 shrink-0 rounded-full px-2.5 text-[11px] font-semibold"
              >
                <Copy size={11} className="mr-1" aria-hidden="true" />
                {copiedKey === "phone" ? "Tersalin" : "Salin"}
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3">
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Penerima &amp; Kontak WhatsApp
                </p>
                <p className="mt-1 text-sm font-bold text-[#1A1A1A]">
                  {order.recipientName}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-[#4B5563]">
                  <Phone
                    size={11}
                    className="text-[#9CA3AF]"
                    aria-hidden="true"
                  />
                  {order.recipientPhone}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                  Alamat Pengiriman
                </p>
                <p className="mt-1 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563]">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Lokasi & Jadwal Antar */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                <MapPin size={13} aria-hidden="true" />
                <span>Lokasi &amp; Jadwal Antar</span>
              </div>
              <Truck size={14} className="text-[#9CA3AF]" aria-hidden="true" />
            </div>

            <div className="mt-3.5 space-y-2.5">
              {/* Row 1: Titik Tujuan Pengantaran */}
              <div className="flex items-start gap-3 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FDF2F8] text-[#BE185D]">
                  <MapPin size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Titik Tujuan Pengantaran
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
                    {primaryLocation}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6B7280]">
                    {secondaryLocation}
                  </p>
                </div>
              </div>

              {/* Row 2: Kurir Pengantaran */}
              <div className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Truck size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Kurir Pengantaran
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#1A1A1A]">
                    {order.courierLabel ??
                      order.courier ??
                      "Kurir Atelier Internal Tasikmalaya"}
                  </p>
                </div>
              </div>

              {/* Row 3: Estimasi Waktu */}
              <div className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A]">
                  <Clock size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Estimasi Waktu
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#1A1A1A]">
                    {formatRelativeAge(new Date(), order.createdAt)} sejak
                    dipesan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: Instruksi Pengantaran */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5 md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                <ClipboardCheck size={13} aria-hidden="true" />
                <span>Instruksi Pengantaran</span>
              </div>
              <span className="text-[10px] font-semibold text-[#9CA3AF]">
                SOP Kurir
              </span>
            </div>
            <div className="mt-3 rounded-xl border border-[#FED7AA]/70 bg-[#FFF7F2] p-3.5 text-xs leading-relaxed text-[#9A3412]">
              &ldquo;Harap tiba sebelum pukul 11.30 WIB tepat di titik serah
              terima ({primaryLocation}). Konfirmasi melalui WhatsApp penerima (
              {order.recipientPhone}) saat kurir meluncur dari atelier.&rdquo;
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-2.5 text-[11px] text-[#6B7280]">
            Penerima wajib tanda tangan serah terima fisik buket di lokasi.
          </div>
        </section>
      </div>

      {/* Baris 3: Item Komposisi Floral (Full Width Row) */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
              <Flower2 size={13} aria-hidden="true" />
              <span>Item Komposisi Floral</span>
            </div>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Rincian buket, varian ukuran/wrapping, dan kalkulasi biaya
            </p>
          </div>
          <Badge className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-[10px] font-bold text-[#4B5563]">
            {itemCount} ITEM PRODUK
          </Badge>
        </div>

        <ul className="divide-y divide-[#F3F4F6]">
          {order.items.map((item, idx) => {
            const variant = [item.sizeLabel, item.wrapLabel]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={`${item.slug}-${item.sizeId}-${item.wrapId}-${idx}`}
                className="flex items-start gap-3.5 py-3.5"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-[#E5E7EB]"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FED7AA]"
                  >
                    <Flower2 size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {item.name}
                    </p>
                    <p className="shrink-0 text-sm font-extrabold text-[#111111]">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </div>

                  {variant ? (
                    <p className="mt-1 inline-block rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#4B5563]">
                      {variant}
                    </p>
                  ) : null}

                  <p className="mt-1 text-xs text-[#6B7280]">
                    Kuantitas:{" "}
                    <strong className="text-[#374151]">{item.qty}</strong> ×{" "}
                    {formatRupiah(item.price)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <dl className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-4 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <dt className="text-[#6B7280]">Subtotal produk</dt>
            <dd className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
              {formatRupiah(order.totals.subtotal)}
            </dd>
          </div>
          <div>
            <dt className="text-[#6B7280]">Diskon produk</dt>
            <dd className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
              {order.totals.productDiscount > 0
                ? `- ${formatRupiah(order.totals.productDiscount)}`
                : formatRupiah(0)}
            </dd>
          </div>
          <div>
            <dt className="text-[#6B7280]">Ongkos kirim</dt>
            <dd className="mt-0.5 text-sm font-bold text-emerald-700">
              {order.totals.shipping === 0
                ? "GRATIS"
                : formatRupiah(order.totals.shipping)}
            </dd>
          </div>
          <div>
            <dt className="text-[#6B7280]">Potongan kupon</dt>
            <dd className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
              {order.totals.couponDiscount > 0
                ? `- ${formatRupiah(order.totals.couponDiscount)}`
                : formatRupiah(0)}
            </dd>
          </div>
          <div className="border-t border-[#E5E7EB] pt-2 sm:border-t-0 sm:pt-0">
            <dt className="font-semibold text-[#1A1A1A]">Grand total</dt>
            <dd className="mt-0.5 text-base font-extrabold text-[#BE185D]">
              {formatRupiah(order.totals.grandTotal)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Baris 4: Pembayaran & Bukti Transfer + Total Tagihan Final (Row) */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Inspeksi Bukti Transfer (8 kolom) */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
              <ReceiptText size={13} aria-hidden="true" />
              <span>Inspeksi Bukti Transfer</span>
            </div>
            <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[10px] font-semibold text-[#4B5563]">
              {order.payment.label || "m-BCA Electronic Slip"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-12">
            {/* Preview Slip */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D6CBC6] bg-[#FAF7F5] p-4 text-center sm:col-span-5">
              {order.paymentProofUrl ? (
                <div className="w-full space-y-2">
                  <img
                    src={order.paymentProofUrl}
                    alt={`Bukti transfer pesanan ${order.code}`}
                    className="mx-auto max-h-56 w-full rounded-lg bg-white object-contain ring-1 ring-[#EAE2DE]"
                  />
                  <p className="truncate text-[11px] font-medium text-[#57534E]">
                    {order.paymentProofName ?? "bukti-pembayaran"}
                  </p>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#FBCFE8] bg-[#FDF2F8] px-3 py-1 text-[11px] font-semibold text-[#9D174D] hover:bg-[#FCE7F3]"
                  >
                    Buka gambar penuh
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D]">
                    <FileCheck2 size={20} aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#1C1917]">
                    Belum ada bukti transfer diunggah
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#57534E]">
                    Slip mutasi {order.payment.bank?.name ?? "BCA"} akan tampil
                    otomatis di sini setelah pelanggan mengunggah bukti bayar.
                  </p>
                </>
              )}
            </div>

            {/* Detail Mutasi & Rekening */}
            <div className="flex flex-col justify-between space-y-3 sm:col-span-7">
              <dl className="divide-y divide-[#F3F4F6] rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] px-3.5 py-2 text-xs">
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[#6B7280]">Rekening Tujuan</dt>
                  <dd className="font-mono font-semibold text-[#1A1A1A]">
                    {bankAccountDisplay}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[#6B7280]">Atas Nama</dt>
                  <dd className="font-semibold text-[#1A1A1A]">
                    {bankHolderDisplay}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[#6B7280]">Waktu</dt>
                  <dd className="font-semibold text-[#1A1A1A]">
                    {formatOrderDate(order.updatedAt || order.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[#6B7280]">Transaksi</dt>
                  <dd className="font-bold text-[#1A1A1A]">
                    {formatRupiah(order.totals.grandTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-[#6B7280]">No. Referensi</dt>
                  <dd className="font-mono font-semibold text-[#1A1A1A]">
                    {referenceNumber}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Perbandingan Nominal Resi vs Tagihan */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5">
            <div>
              <span className="text-[11px] font-semibold text-[#6B7280]">
                Nominal Resi vs Tagihan
              </span>
              <div className="mt-0.5 text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
                {formatRupiah(order.totals.grandTotal)}
              </div>
            </div>
            <span
              className={
                order.paymentProofUrl
                  ? "inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#166534]"
                  : "inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#92400E]"
              }
            >
              <CheckCircle2 size={13} aria-hidden="true" />
              {order.paymentProofUrl ? "BUKTI TERLAMPIR" : "MENUNGGU BUKTI"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {order.status === "pending_verification" && (
              <Button
                type="button"
                onClick={() => handleAction("verify")}
                className="flex-1 rounded-xl bg-[#BE185D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9D174D]"
              >
                Verifikasi Pembayaran
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRejectPanel((prev) => !prev)}
              className="flex-1 rounded-xl border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2 text-xs font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEE2E2]"
            >
              Tolak Pembayaran…
            </Button>
          </div>
        </section>

        {/* Total Tagihan Final (4 kolom) */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5 lg:col-span-4">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                <CreditCard size={13} aria-hidden="true" />
                <span>Total Tagihan Final</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#FED7AA]/60 bg-[#FDF2F8] p-4 text-center sm:text-left">
                <p className="text-xs font-medium text-[#6B7280]">
                  Tagihan Keseluruhan ({itemCount} item)
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
                  {formatRupiah(order.totals.grandTotal)}
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs text-[#4B5563]">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <strong className="text-[#1A1A1A]">
                    {order.payment.label || "Transfer Bank"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Pengiriman:</span>
                  <strong className="text-[#1A1A1A]">
                    {order.totals.shipping === 0 ? "Gratis Ongkir" : "Reguler"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Status Audit:</span>
                  <strong className="text-emerald-700">
                    Tervalidasi Sistem
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white p-3 text-center text-[11px] text-[#6B7280]">
            Transaksi tercatat pada buku kas atelier Delysa Florist
          </div>
        </section>
      </div>

      {/* Baris 5: Kartu Ucapan Custom (jika ada) & Jejak Audit (Row) */}
      <div
        className={cn(
          "grid gap-5",
          order.customNote ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Kartu Ucapan Custom */}
        {order.customNote && (
          <section className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                  <MessageSquareQuote size={13} aria-hidden="true" />
                  <span>Kartu Ucapan Custom</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(order.customNote ?? "", "note")}
                  className="h-7 shrink-0 rounded-full px-2.5 text-[10px] font-semibold"
                >
                  <Sparkles size={11} className="mr-1" aria-hidden="true" />
                  {copiedKey === "note" ? "Tersalin" : "Salin Teks"}
                </Button>
              </div>
              <div className="mt-4 rounded-xl border border-[#FED7AA]/60 bg-[#FDF2F8] p-4 text-sm italic leading-relaxed text-[#1A1A1A]">
                &ldquo;{order.customNote}&rdquo;
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[#F3F4F6] pt-2.5 text-[11px] text-[#6B7280]">
              <span>Penerima: {order.recipientName}</span>
              <span>Pilihan Kartu: Embossed Ivory Linen</span>
            </div>
          </section>
        )}

        {/* Jejak Audit & Log Transaksi */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
              <History size={13} aria-hidden="true" />
              <span>Jejak Audit &amp; Log Transaksi</span>
            </div>
            <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[10px] font-semibold text-[#6B7280]">
              IMMUTABLE LOG
            </span>
          </div>
          <OrderStatusTimeline events={order.timeline} status={order.status} />
        </section>
      </div>

      {/* Baris 6 (Kondisional): Konfirmasi Penolakan Pembayaran (Full Width Row) */}
      {(order.status === "rejected" || showRejectPanel) && (
        <section className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#FECACA] pb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#B91C1C] uppercase">
              <ShieldAlert size={13} aria-hidden="true" />
              <span>Konfirmasi Penolakan Pembayaran</span>
            </div>
            <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]">
              TINDAKAN SENSITIF
            </span>
          </div>

          <div className="mt-3 space-y-2 rounded-xl border border-[#FECACA] bg-white p-3">
            {[
              "Nominal tidak sesuai",
              "Bukti transfer buram/palsu",
              "Lainnya (Tuliskan catatan)",
            ].map((reason) => (
              <label
                key={reason}
                className="flex cursor-pointer items-center gap-2 select-none"
              >
                <input
                  type="radio"
                  name="alasan"
                  checked={rejectReason === reason}
                  onChange={() => setRejectReason(reason)}
                  className="accent-[#B91C1C]"
                />
                <span className="text-xs text-[#374151]">{reason}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#991B1B] uppercase">
              Catatan Notifikasi Pelanggan (Dikirim via WhatsApp/Email)
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="w-full rounded-xl border border-[#FECACA] bg-white p-3 text-xs leading-relaxed text-[#374151] focus:ring-2 focus:ring-[#B91C1C]/20 focus:outline-none"
              rows={3}
              placeholder={`Halo ${order.recipientName}, mohon maaf mutasi pembayaran untuk pesanan ${order.code} belum terdeteksi pada rekening atelier kami...`}
            />
          </div>

          <div className="mt-3 rounded-xl border border-[#FCA5A5] bg-white/80 p-3 text-xs leading-relaxed text-[#991B1B]">
            Perhatian: Menolak pembayaran akan membatalkan reservasi slot
            perangkaian dan mengembalikan alokasi bunga ke inventaris atelier.
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRejectPanel(false)}
              className="rounded-lg bg-white px-3 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              className="rounded-lg px-3 text-xs font-semibold"
            >
              Konfirmasi Tolak &amp; Kembalikan Stok
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function copyText(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(value)
    .then(() => true)
    .catch(() => false);
}
