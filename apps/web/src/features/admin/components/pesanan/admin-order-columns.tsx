import {
  createColumnHelper,
  sortFn_alphanumeric,
  sortFn_basic,
} from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatIDR } from "~/features/shop/lib/format";
import { formatOrderShortDate } from "~/features/shop/lib/order-format";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import type { AdminOrderActionId } from "../../lib/pesanan/admin-order-transition";
import { getAdminOrderActions } from "../../lib/pesanan/admin-order-transition";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";
import {
  formatRelativeAge,
  shortAddress,
  summarizeItems,
} from "../../lib/pesanan/admin-order-format";
import { adminOrderTableFeatures } from "../../lib/pesanan/admin-order-table-config";

const columnHelper = createColumnHelper<
  typeof adminOrderTableFeatures,
  AdminOrderView
>();

const PAYMENT_KIND_LABEL: Record<AdminOrderView["paymentKind"], string> = {
  manual: "Transfer Manual",
  instant: "QRIS",
  invoice: "Invoice",
};

function PriorityChip({ order }: { order: AdminOrderView }) {
  const isPrioritas = order.slaBreached || order.priority === "prioritas";

  return (
    <Badge
      className={
        isPrioritas
          ? "border-transparent bg-[#FEE2E2] text-[#B91C1C]"
          : "border-transparent bg-[#F3F4F6] text-[#6B7280]"
      }
    >
      {isPrioritas ? "Prioritas" : "SLA Normal"}
    </Badge>
  );
}

function BatchChip({ order }: { order: AdminOrderView }) {
  if (order.batch !== "unsil") return null;

  return (
    <Badge className="border-transparent bg-[#FFF3ED] text-[#C2410C]">
      Wisuda UNSIL
    </Badge>
  );
}

export function createAdminOrderColumns({
  onView,
  onAction,
  onReject,
}: {
  onView: (order: AdminOrderView) => void;
  onAction: (order: AdminOrderView, actionId: AdminOrderActionId) => void;
  onReject: (order: AdminOrderView) => void;
}) {
  return columnHelper.columns([
    columnHelper.accessor((row) => row.code, {
      id: "code",
      header: "Order",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <button
            type="button"
            onClick={() => onView(row.original)}
            className="max-w-full truncate font-mono text-xs font-bold text-[#111111] underline-offset-2 hover:underline"
          >
            {row.original.code}
          </button>
          <p className="text-[10px] font-medium text-[#6B7280]">
            {formatOrderShortDate(row.original.createdAt)} WIB
          </p>
          <BatchChip order={row.original} />
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.recipientName, {
      id: "recipient",
      header: "Pelanggan",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#1A1A1A] sm:text-sm">
            {row.original.recipientName}
          </p>
          <p className="text-[11px] text-[#6B7280]">
            {row.original.recipientPhone}
          </p>
          <p className="max-w-[14rem] truncate text-[10px] text-[#9CA3AF]">
            {shortAddress(row.original.shippingAddress)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.totals.grandTotal, {
      id: "total",
      header: "Item & Total",
      sortFn: sortFn_basic,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#1A1A1A]">
            {formatIDR(row.original.totals.grandTotal)}
          </p>
          <p className="max-w-[12rem] truncate text-[11px] text-[#6B7280]">
            {summarizeItems(row.original.items)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.paymentKind, {
      id: "payment",
      header: "Metode",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#1A1A1A]">
            {row.original.payment.bank?.name ??
              (row.original.payment.methodId === "qris" ? "QRIS" : "Invoice")}
          </p>
          <p className="text-[11px] text-[#6B7280]">
            {PAYMENT_KIND_LABEL[row.original.paymentKind]}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.createdAt, {
      id: "age",
      header: "Umur",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-[#374151]">
            {formatRelativeAge(new Date(), row.original.createdAt)}
          </p>
          {row.original.workbench ? (
            <p className="text-[10px] text-[#6B7280]">
              {row.original.workbench}
            </p>
          ) : null}
          {row.original.courierLabel ? (
            <p className="text-[10px] text-[#6B7280]">
              {row.original.courierLabel}
            </p>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.status, {
      id: "status",
      header: "Status",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <OrderStatusBadge status={row.original.status} />
          <PriorityChip order={row.original} />
        </div>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: () => <span className="sr-only">Aksi</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <div className="flex flex-col items-stretch gap-1.5">
            {getAdminOrderActions(order.status).map((action) => (
              <Button
                key={action.id}
                type="button"
                size="sm"
                variant={
                  action.variant === "destructive" ? "destructive" : "default"
                }
                onClick={() =>
                  action.variant === "destructive"
                    ? onReject(order)
                    : onAction(order, action.id)
                }
                className="h-8 rounded-lg px-2.5 text-xs font-semibold"
              >
                {action.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onView(order)}
              className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold text-[#6B7280]"
            >
              Lihat
            </Button>
          </div>
        );
      },
    }),
  ]);
}
