import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import {
  fetchAdminReportApi,
  type AdminSalesReport,
} from "~/features/shop/api/endpoints";
import { isMockMode } from "~/features/shop/api/http";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { useAdminOrders } from "../hooks/use-admin-orders";
import { formatRupiah } from "../lib/products/product-filters";

type Period = "7d" | "30d" | "all";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "all", label: "Semua Waktu" },
];

const VERIFIED_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
]);
const PENDING_STATUSES = new Set(["pending_payment", "pending_verification"]);
const CLOSED_STATUSES = new Set(["cancelled", "rejected"]);

function downloadReportCsv(report: AdminSalesReport) {
  const header = ["Kode Pesanan", "Penerima", "Status", "Total (IDR)", "Waktu"];
  const rows = report.recentOrders.map((order) => [
    order.code,
    `"${order.recipientName.replace(/"/g, '""')}"`,
    order.status,
    String(order.total),
    order.createdAt,
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-penjualan-delysa-${report.period}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { orders } = useAdminOrders();

  const reportQuery = useQuery({
    queryKey: ["admin", "reports", period],
    queryFn: ({ signal }) => fetchAdminReportApi(period, signal),
    enabled: !isMockMode(),
    staleTime: 10_000,
  });

  // Fallback lokal hanya saat mode mock (VITE_API_URL kosong).
  const mockReport = useMemo<AdminSalesReport>(() => {
    const cutoff =
      period === "7d"
        ? Date.now() - 7 * 86_400_000
        : period === "30d"
          ? Date.now() - 30 * 86_400_000
          : 0;
    const scoped = orders.filter((o) => Date.parse(o.createdAt) >= cutoff);
    const verified = scoped.filter((o) => VERIFIED_STATUSES.has(o.status));
    const totalRevenue = verified.reduce(
      (sum, o) => sum + o.totals.grandTotal,
      0,
    );
    const totalItemsSold = verified.reduce(
      (sum, o) => sum + o.items.reduce((s, item) => s + item.qty, 0),
      0,
    );

    const productMap = new Map<
      string,
      {
        name: string;
        slug: string;
        category: string;
        qty: number;
        revenue: number;
      }
    >();
    for (const order of verified) {
      for (const item of order.items) {
        const entry = productMap.get(item.slug) ?? {
          name: item.name,
          slug: item.slug,
          category: "Buket",
          qty: 0,
          revenue: 0,
        };
        entry.qty += item.qty;
        entry.revenue += item.price * item.qty;
        productMap.set(item.slug, entry);
      }
    }

    const topProducts = [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      period,
      summary: {
        totalRevenue,
        totalOrders: scoped.length,
        completedOrders: scoped.filter((o) => o.status === "delivered").length,
        pendingOrders: scoped.filter((o) => PENDING_STATUSES.has(o.status))
          .length,
        cancelledOrders: scoped.filter((o) => CLOSED_STATUSES.has(o.status))
          .length,
        averageOrderValue:
          verified.length > 0 ? Math.round(totalRevenue / verified.length) : 0,
        totalItemsSold,
      },
      byCategory:
        totalItemsSold > 0
          ? [{ category: "Buket", qty: totalItemsSold, revenue: totalRevenue }]
          : [],
      topProducts,
      recentOrders: scoped.slice(0, 10).map((o) => ({
        code: o.code,
        recipientName: o.recipientName,
        status: o.status,
        total: o.totals.grandTotal,
        createdAt: o.createdAt,
      })),
    };
  }, [orders, period]);

  const report = isMockMode() ? mockReport : (reportQuery.data ?? mockReport);
  const loading = !isMockMode() && reportQuery.isPending;
  const maxCategoryRevenue = Math.max(
    1,
    ...report.byCategory.map((row) => row.revenue),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#BE185D] uppercase">
            Laporan Penjualan Delysa Florist
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1C1917]">
            Ringkasan Omzet &amp; Transaksi
          </h1>
          <p className="mt-1 text-xs text-[#57534E] sm:text-sm">
            Omzet dihitung dari pesanan terverifikasi (dibayar, dirangkai,
            diantar, selesai) langsung dari database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter periode laporan"
            className="inline-flex rounded-xl border border-[#EAE2DE] bg-[#FAF7F5] p-1"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={period === opt.value}
                onClick={() => setPeriod(opt.value)}
                className={
                  period === opt.value
                    ? "rounded-lg bg-[#BE185D] px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                    : "rounded-lg px-3 py-1.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917]"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => downloadReportCsv(report)}
            disabled={report.recentOrders.length === 0}
            className="h-9 rounded-xl border-[#C7BBB5] bg-white px-3.5 text-xs font-semibold text-[#1C1917] hover:border-[#BE185D] hover:bg-[#FDF2F8] hover:text-[#9D174D]"
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </header>

      <section aria-label="Metrik penjualan">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57534E]">
                Omzet Terverifikasi
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <Wallet size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatRupiah(report.summary.totalRevenue)
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E] tabular-nums">
              {report.summary.totalItemsSold} rangkaian terjual
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57534E]">
                Total Pesanan
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <ClipboardList size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                report.summary.totalOrders
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E] tabular-nums">
              {report.summary.pendingOrders} menunggu ·{" "}
              {report.summary.cancelledOrders} batal/ditolak
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57534E]">
                Pesanan Selesai
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534] ring-1 ring-[#BBF7D0]">
                <CheckCircle2 size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                report.summary.completedOrders
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E]">
              Terkirim ke penerima Tasikmalaya
            </p>
          </div>

          <div className="rounded-2xl border border-[#EAE2DE] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#57534E]">
                Rata-rata Transaksi
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#BE185D] ring-1 ring-[#FBCFE8]">
                <TrendingUp size={15} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[#1C1917] tabular-nums">
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                formatRupiah(report.summary.averageOrderValue)
              )}
            </div>
            <p className="mt-1 text-xs text-[#57534E]">
              Per pesanan terverifikasi
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#1C1917]">
            Omzet per Kategori
          </h2>
          <p className="text-xs text-[#57534E]">
            Kontribusi kategori rangkaian pada periode terpilih
          </p>

          <div className="mt-4 space-y-3">
            {report.byCategory.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#EAE2DE] bg-[#FAF7F5] p-6 text-center text-xs text-[#57534E]">
                Belum ada penjualan terverifikasi pada periode ini.
              </p>
            ) : (
              report.byCategory.map((item) => {
                const pct = Math.max(
                  6,
                  Math.round((item.revenue / maxCategoryRevenue) * 100),
                );
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1C1917]">
                        {item.category}{" "}
                        <span className="font-normal text-[#57534E]">
                          ({item.qty} pcs)
                        </span>
                      </span>
                      <span className="font-bold text-[#BE185D] tabular-nums">
                        {formatRupiah(item.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#FAF7F5] ring-1 ring-[#EAE2DE]">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-[#BE185D]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#1C1917]">
            Produk Terlaris Periode Ini
          </h2>
          <p className="text-xs text-[#57534E]">
            Berdasarkan total pendapatan dari transaksi terverifikasi
          </p>

          <div className="mt-4 space-y-2.5">
            {report.topProducts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#EAE2DE] bg-[#FAF7F5] p-6 text-center text-xs text-[#57534E]">
                Belum ada data produk terjual pada periode ini.
              </p>
            ) : (
              report.topProducts.map((product, index) => (
                <div
                  key={product.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE2DE] bg-[#FAF7F5]/60 px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FDF2F8] text-xs font-bold text-[#9D174D] ring-1 ring-[#FBCFE8] tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1C1917]">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[#57534E]">
                        {product.category} · {product.qty} terjual
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#BE185D] tabular-nums">
                    {formatRupiah(product.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#EAE2DE] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              Transaksi Terbaru
            </h2>
            <p className="text-xs text-[#57534E]">
              Klik kode pesanan untuk memeriksa detail atau bukti transfer
            </p>
          </div>
          <Link
            to="/admin/pesanan"
            className="text-xs font-semibold text-[#BE185D] underline-offset-4 hover:text-[#9D174D] hover:underline"
          >
            Lihat semua pesanan
          </Link>
        </div>

        {report.recentOrders.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#EAE2DE] bg-[#FAF7F5] p-6 text-center text-xs text-[#57534E]">
            Belum ada pesanan tercatat pada periode ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE2DE] text-[#57534E]">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Kode
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Penerima
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Waktu
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0ED]">
                {report.recentOrders.map((order) => (
                  <tr key={order.code} className="hover:bg-[#FAF7F5]/80">
                    <td className="py-2.5 pr-3">
                      <Link
                        to="/admin/pesanan/$orderId"
                        params={{ orderId: order.code }}
                        className="font-mono font-bold text-[#BE185D] hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-[#1C1917]">
                      {order.recipientName}
                    </td>
                    <td className="py-2.5 pr-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-2.5 pr-3 text-[#57534E]">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#1C1917] tabular-nums">
                      {formatRupiah(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
