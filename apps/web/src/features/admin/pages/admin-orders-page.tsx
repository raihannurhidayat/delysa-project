import { useCallback, useMemo, useState } from "react";
import { useTable } from "@tanstack/react-table";
import { Skeleton } from "~/components/ui/skeleton";
import { createAdminManualOrderApi } from "~/features/shop/api/endpoints";
import { isMockMode } from "~/features/shop/api/http";
import { saveOrder, updateOrderStatus } from "~/features/shop/lib/order-store";
import { AdminOrderDetailDrawer } from "../components/pesanan/admin-order-detail-drawer";
import { AdminOrderManualDialog } from "../components/pesanan/admin-order-manual-dialog";
import { AdminOrderPagination } from "../components/pesanan/admin-order-pagination";
import { AdminOrderRejectDialog } from "../components/pesanan/admin-order-reject-dialog";
import { AdminOrderStatsCards } from "../components/pesanan/admin-order-stats-cards";
import { AdminOrderStatusTabs } from "../components/pesanan/admin-order-status-tabs";
import { AdminOrderTable } from "../components/pesanan/admin-order-table";
import { AdminOrderToolbar } from "../components/pesanan/admin-order-toolbar";
import { AdminOrdersPageHeader } from "../components/pesanan/admin-orders-page-header";
import { createAdminOrderColumns } from "../components/pesanan/admin-order-columns";
import { useAdminOrders } from "../hooks/use-admin-orders";
import { useAdminOrderActions } from "../hooks/use-admin-order-actions";
import {
  filterAdminOrders,
  summarizeAdminOrders,
} from "../lib/pesanan/admin-order-filters";
import { DEFAULT_ADMIN_ORDER_FILTERS } from "../lib/pesanan/admin-order-filters";
import type { AdminOrderFilters } from "../lib/pesanan/admin-order.types";
import type { AdminOrderActionId } from "../lib/pesanan/admin-order-transition";
import {
  ADMIN_ORDER_PAGE_SIZE,
  adminOrderTableFeatures,
} from "../lib/pesanan/admin-order-table-config";
import {
  createManualOrderRecord,
  generateManualOrderCode,
} from "../lib/pesanan/manual-order";
import type { AdminOrderView } from "../lib/pesanan/admin-order.types";

const QUEUE_TAB: Record<
  "verification" | "assembly" | "delivery",
  AdminOrderFilters["statusTab"]
> = {
  verification: "pending_verification",
  assembly: "processing",
  delivery: "shipped",
};

const PAGE_FOOTNOTE =
  "Batch UNSIL, prioritas SLA, meja florist, dan kurir merupakan label contoh " +
  "yang dihitung otomatis di layer admin dan belum tersinkron dengan sistem " +
  "produksi. Integrasi API order akan mengikuti.";

export function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilters>(
    DEFAULT_ADMIN_ORDER_FILTERS,
  );
  const [detailOrder, setDetailOrder] = useState<AdminOrderView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOrder, setRejectOrder] = useState<AdminOrderView | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const { orders, mounted } = useAdminOrders();
  const { applyAction } = useAdminOrderActions();

  const filteredOrders = useMemo(
    () => filterAdminOrders(orders, filters),
    [orders, filters],
  );
  const tabScopedOrders = useMemo(
    () => filterAdminOrders(orders, { ...filters, statusTab: "all" }),
    [orders, filters],
  );
  const summary = useMemo(
    () => summarizeAdminOrders(tabScopedOrders),
    [tabScopedOrders],
  );

  const openDetail = useCallback((order: AdminOrderView) => {
    setDetailOrder(order);
    setDetailOpen(true);
  }, []);

  const openReject = useCallback((order: AdminOrderView) => {
    setRejectOrder(order);
    setRejectOpen(true);
  }, []);

  const handleAction = useCallback(
    (order: AdminOrderView, actionId: AdminOrderActionId) => {
      applyAction(order, actionId);
    },
    [applyAction],
  );

  const handleRejectSubmit = useCallback((code: string, reason: string) => {
    updateOrderStatus(code, "rejected", { note: `Ditolak admin: ${reason}` });
  }, []);

  const handleManualSubmit = useCallback(
    (values: Parameters<typeof createManualOrderRecord>[0]) => {
      const record = createManualOrderRecord(
        values,
        generateManualOrderCode(new Date()),
      );
      if (isMockMode()) {
        saveOrder(record);
        setManualOpen(false);
        return;
      }
      void createAdminManualOrderApi({
        recipientName: record.recipientName,
        recipientPhone: record.recipientPhone,
        shippingAddress: record.shippingAddress,
        customNote: record.customNote,
        paymentMethod:
          record.payment.methodId === "qris" ? "qris" : "bca_transfer",
        status: record.status,
        items: record.items.map((item) => ({
          slug: item.slug,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      })
        .then((serverOrder) => {
          saveOrder(serverOrder);
          setManualOpen(false);
        })
        .catch(() => {
          saveOrder(record);
          setManualOpen(false);
        });
    },
    [],
  );

  const columns = useMemo(
    () =>
      createAdminOrderColumns({
        onView: openDetail,
        onAction: handleAction,
        onReject: openReject,
      }),
    [openDetail, handleAction, openReject],
  );

  const table = useTable({
    features: adminOrderTableFeatures,
    columns,
    data: filteredOrders,
    initialState: {
      pagination: { pageIndex: 0, pageSize: ADMIN_ORDER_PAGE_SIZE },
    },
  });

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.statusTab !== "all" ||
    filters.period !== "all" ||
    filters.batch !== "all";

  function handleFiltersChange(next: AdminOrderFilters) {
    setFilters(next);
    table.setPageIndex(0);
  }

  function handleResetFilters() {
    handleFiltersChange({ ...DEFAULT_ADMIN_ORDER_FILTERS });
  }

  return (
    <div className="min-w-0 space-y-4">
      <AdminOrdersPageHeader onCreateManual={() => setManualOpen(true)} />

      <AdminOrderStatsCards
        verification={summary.verification}
        assembly={summary.assembly}
        delivery={summary.delivery}
        onSelect={(queue) =>
          handleFiltersChange({
            ...filters,
            statusTab: QUEUE_TAB[queue],
          })
        }
      />

      <section
        aria-label="Daftar pesanan"
        className="min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
      >
        <div className="border-b border-[#E5E7EB] px-3 py-3 sm:px-4">
          {mounted ? (
            <AdminOrderStatusTabs
              value={filters.statusTab}
              counts={summary.counts}
              onChange={(statusTab) =>
                handleFiltersChange({ ...filters, statusTab })
              }
            />
          ) : (
            <Skeleton className="h-9 w-full" />
          )}
        </div>

        <div className="border-b border-[#E5E7EB] px-3 py-3 sm:px-4">
          <AdminOrderToolbar
            filters={filters}
            onChange={handleFiltersChange}
            resultCount={filteredOrders.length}
            onReset={handleResetFilters}
          />
        </div>

        {mounted ? (
          <>
            <AdminOrderTable
              table={table}
              hasFilters={hasFilters}
              onReset={handleResetFilters}
              onView={openDetail}
              onReject={openReject}
            />
            <AdminOrderPagination table={table} />
          </>
        ) : (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        )}
      </section>

      <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        {PAGE_FOOTNOTE}
      </p>

      <AdminOrderDetailDrawer
        order={detailOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <AdminOrderRejectDialog
        order={rejectOrder}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={handleRejectSubmit}
      />

      <AdminOrderManualDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
}
