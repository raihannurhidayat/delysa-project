import { useMemo, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Clock,
  Flower2,
  Package,
  PieChart,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { useAdminOrders } from "../hooks/use-admin-orders";
import { summarizeAdminOrders } from "../lib/pesanan/admin-order-filters";
import { summarizeItems } from "../lib/pesanan/admin-order-format";
import {
  formatRupiah,
  getStockStatus,
  summarizeProducts,
} from "../lib/products/product-filters";
import {
  getAdminProducts,
  subscribeAdminProducts,
} from "../lib/products/product-store";

const PRIORITY_STATUSES = new Set([
  "pending_verification",
  "paid",
  "processing",
]);

export function AdminDashboardPage({ user }: { user: AuthUser }) {
  const firstName = user.name.split(" ")[0] ?? user.name;
  const { orders, mounted } = useAdminOrders();
  const products = useSyncExternalStore(
    subscribeAdminProducts,
    getAdminProducts,
    getAdminProducts,
  );

  const orderSummary = useMemo(() => summarizeAdminOrders(orders), [orders]);
  const productSummary = useMemo(() => summarizeProducts(products), [products]);

  const priorityOrders = useMemo(
    () =>
      orders.filter((order) => PRIORITY_STATUSES.has(order.status)).slice(0, 4),
    [orders],
  );

  const criticalProducts = useMemo(
    () =>
      products
        .filter((product) => getStockStatus(product) !== "aman")
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 4),
    [products],
  );

  const criticalStockCount =
    productSummary.lowStock + productSummary.outOfStock;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F8] px-3 py-1 text-[11px] font-semibold text-[#9D174D] ring-1 ring-[#FBCFE8]">
          <ShieldCheck size={13} aria-hidden="true" />
          Admin Delysa Florist
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1C1917] sm:text-3xl">
          Halo, {firstName}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#57534E]">
          Pantau antrean pesanan, verifikasi pembayaran, dan ketersediaan stok
          rangkaian Delysa Florist dari satu tempat.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            to="/admin/produk/tambah"
            className={buttonVariants({
              className:
                "h-11 rounded-full bg-[#BE185D] px-5 text-sm font-semibold text-white hover:bg-[#9D174D] sm:h-10",
            })}
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Produk
          </Link>
          <Link
            to="/admin/pesanan"
            className={buttonVariants({
              variant: "outline",
              className:
                "h-11 rounded-full border-[#C7BBB5] bg-white px-5 text-sm font-semibold text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D] sm:h-10",
            })}
          >
            <ClipboardList size={15} aria-hidden="true" />
            Kelola Pesanan
          </Link>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
              className:
                "h-11 rounded-full border-[#EAE2DE] bg-[#FAF7F5] px-5 text-sm font-semibold text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D] sm:h-10",
            })}
          >
            Buka storefront
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="Ringkasan operasional">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/pesanan"
            className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#57534E]">
                Perlu Verifikasi
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <Clock size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {mounted ? (
                orderSummary.verification
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E] group-hover:text-[#9D174D]">
              Bukti bayar menunggu cek admin
            </p>
          </Link>

          <Link
            to="/admin/pesanan"
            className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#57534E]">
                Sedang Dirangkai
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <Flower2 size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {mounted ? (
                orderSummary.assembly
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E] group-hover:text-[#9D174D]">
              Pesanan aktif di meja florist
            </p>
          </Link>

          <Link
            to="/admin/pesanan"
            className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#57534E]">
                Dalam Pengantaran
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <Truck size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {mounted ? (
                orderSummary.delivery
              ) : (
                <Skeleton className="h-8 w-12" />
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E] group-hover:text-[#9D174D]">
              Sedang diantar kurir Tasikmalaya
            </p>
          </Link>

          <Link
            to="/admin/produk"
            className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#57534E]">
                Stok Kritis
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E] ring-1 ring-[#FDE68A]">
                <AlertTriangle size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {criticalStockCount}
            </div>
            <p className="mt-1 text-xs text-[#57534E] group-hover:text-[#9D174D]">
              {productSummary.outOfStock} habis, {productSummary.lowStock}{" "}
              menipis dari {productSummary.total} produk
            </p>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-label="Antrean pesanan prioritas"
          className="flex flex-col rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                Antrean Pesanan Perlu Tindakan
              </h2>
              <p className="text-xs text-[#57534E]">
                Pesanan menunggu verifikasi, sudah dibayar, atau dirangkai
              </p>
            </div>
            <Link
              to="/admin/pesanan"
              className="shrink-0 text-xs font-semibold text-[#BE185D] underline-offset-4 hover:text-[#9D174D] hover:underline"
            >
              Semua pesanan
            </Link>
          </div>

          <div className="mt-4 flex-1 space-y-2.5">
            {!mounted ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))
            ) : priorityOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#EAE2DE] bg-[#FAF7F5] p-6 text-center text-xs text-[#57534E]">
                Tidak ada antrean pesanan mendesak saat ini.
              </p>
            ) : (
              priorityOrders.map((order) => (
                <Link
                  key={order.code}
                  to="/admin/pesanan/$orderId"
                  params={{ orderId: order.code }}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#EAE2DE] bg-[#FAF7F5]/60 p-3 transition-colors hover:border-[#F472B6] hover:bg-[#FDF2F8]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1C1917]">
                        {order.code}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="truncate text-xs font-semibold text-[#1C1917]">
                      {order.recipientName}
                    </p>
                    <p className="truncate text-[11px] text-[#57534E]">
                      {summarizeItems(order.items)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#BE185D] tabular-nums">
                    {formatRupiah(order.totals.grandTotal)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section
          aria-label="Peringatan stok produk"
          className="flex flex-col rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                Peringatan Stok Produk
              </h2>
              <p className="text-xs text-[#57534E]">
                Produk habis atau mendekati batas minimum stok
              </p>
            </div>
            <Link
              to="/admin/produk"
              className="shrink-0 text-xs font-semibold text-[#BE185D] underline-offset-4 hover:text-[#9D174D] hover:underline"
            >
              Semua produk
            </Link>
          </div>

          <div className="mt-4 flex-1 space-y-2.5">
            {criticalProducts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#EAE2DE] bg-[#FAF7F5] p-6 text-center text-xs text-[#57534E]">
                Semua stok produk dalam kondisi aman.
              </p>
            ) : (
              criticalProducts.map((product) => {
                const isOut = product.stock === 0;
                return (
                  <Link
                    key={product.id}
                    to="/admin/produk/$productId"
                    params={{ productId: String(product.id) }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE2DE] bg-[#FAF7F5]/60 p-3 transition-colors hover:border-[#F472B6] hover:bg-[#FDF2F8]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1C1917]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#57534E]">
                        {product.sku} · {product.category}
                      </p>
                    </div>
                    <span
                      className={
                        isOut
                          ? "shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 ring-1 ring-red-200 tabular-nums"
                          : "shrink-0 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#92400E] ring-1 ring-[#FDE68A] tabular-nums"
                      }
                    >
                      {isOut
                        ? "Stok Habis"
                        : `Sisa ${product.stock} ${product.stockUnit}`}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section aria-label="Modul admin" className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/admin/produk"
          className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
            <Package size={17} aria-hidden="true" />
          </span>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1C1917] group-hover:text-[#BE185D]">
              Produk
            </p>
            <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-[10px] font-semibold text-[#9D174D] tabular-nums">
              {productSummary.published}/{productSummary.total} live
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
            Tambah, ubah harga, atur stok, dan publikasikan katalog buket.
          </p>
        </Link>

        <Link
          to="/admin/pesanan"
          className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
            <ClipboardList size={17} aria-hidden="true" />
          </span>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1C1917] group-hover:text-[#BE185D]">
              Pesanan
            </p>
            <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-[10px] font-semibold text-[#9D174D] tabular-nums">
              {mounted ? `${orderSummary.counts.all} pesanan` : "Memuat..."}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
            Verifikasi bukti transfer, catat pesanan manual, dan pantau kurir.
          </p>
        </Link>

        <Link
          to="/admin/laporan"
          className="group rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm transition-colors hover:border-[#F472B6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
            <PieChart size={17} aria-hidden="true" />
          </span>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#1C1917] group-hover:text-[#BE185D]">
              Laporan Penjualan
            </p>
            <span className="rounded-full bg-[#FDF2F8] px-2 py-0.5 text-[10px] font-semibold text-[#9D174D]">
              Live DB
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
            Pantau omzet terverifikasi, kategori terlaris, dan export CSV.
          </p>
        </Link>
      </section>

      <p className="rounded-xl border border-[#EAE2DE] bg-white px-4 py-3 text-xs leading-relaxed text-[#57534E]">
        Ringkasan pesanan dan produk saat ini membaca data store lokal admin
        &amp; toko. Setelah endpoint pesanan dan produk API tersedia, data ini
        akan tersinkron otomatis dengan server produksi.
      </p>
    </div>
  );
}
