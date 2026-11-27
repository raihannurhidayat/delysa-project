import {
  createColumnHelper,
  sortFn_alphanumeric,
  sortFn_basic,
} from "@tanstack/react-table";
import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
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
import { cn } from "cn";

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
      className={cn(
        "rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold",
        isPrioritas
          ? "bg-[#FEE2E2] text-[#B91C1C]"
          : "bg-[#F3F4F6] text-[#6B7280]",
      )}
    >
      {isPrioritas ? "Prioritas" : "SLA Normal"}
    </Badge>
  );
}

function BatchChip({ order }: { order: AdminOrderView }) {
  if (order.batch !== "unsil") return null;

  return (
    <Badge className="inline-flex items-center gap-1 rounded-full border border-[#FED7AA] bg-[#FDF2F8] px-2 py-0.5 text-[10px] font-semibold text-[#9D174D]">
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
        <div className="min-w-0 space-y-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
            className="block max-w-full truncate font-mono text-xs font-bold text-[#111111] transition-colors hover:text-[#9D174D] hover:underline"
            title={row.original.code}
          >
            {row.original.code}
          </button>
          <p className="truncate text-[10px] text-[#6B7280]">
            {formatOrderShortDate(row.original.createdAt)} WIB
          </p>
          <BatchChip order={row.original} />
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.totals.grandTotal, {
      id: "total",
      header: "Item & Total",
      sortFn: sortFn_basic,
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-bold text-[#1A1A1A]">
            {formatIDR(row.original.totals.grandTotal)}
          </p>
          <p
            className="truncate text-[10px] text-[#6B7280]"
            title={summarizeItems(row.original.items)}
          >
            {summarizeItems(row.original.items)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.paymentKind, {
      id: "payment",
      header: "Metode",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => {
        const bankName = row.original.payment.bank?.name;
        const methodName =
          bankName ??
          (row.original.payment.methodId === "qris" ? "QRIS" : "Invoice");
        const subLabel = PAYMENT_KIND_LABEL[row.original.paymentKind];

        return (
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-xs font-semibold text-[#111827]">
              {methodName}
            </p>
            <p className="truncate text-[10px] text-[#6B7280]">
              {subLabel === methodName ? "Instan" : subLabel}
            </p>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.createdAt, {
      id: "age",
      header: "Umur",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-xs font-medium text-[#374151]">
            {formatRelativeAge(new Date(), row.original.createdAt)}
          </p>
          <div className="flex flex-wrap gap-1">
            {row.original.workbench ? (
              <span className="truncate max-w-full rounded bg-[#F3F4F6] px-1.5 py-0.2 text-[9px] font-medium text-[#4B5563]">
                {row.original.workbench}
              </span>
            ) : null}
            {row.original.courierLabel ? (
              <span
                className="truncate max-w-full rounded bg-[#ECFDF5] px-1.5 py-0.2 text-[9px] font-medium text-[#047857]"
                title={row.original.courierLabel}
              >
                {row.original.courierLabel}
              </span>
            ) : null}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.status, {
      id: "status",
      header: "Status",
      sortFn: sortFn_alphanumeric,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col items-start gap-1">
          <OrderStatusBadge
            status={row.original.status}
            className="max-w-full truncate px-2 py-0.5 text-[10px]"
          />
          <PriorityChip order={row.original} />
        </div>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: () => <span className="block pr-1 text-right">Aksi</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const order = row.original;
        const actions = getAdminOrderActions(order.status);
        const primaryActions = actions.filter(
          (a) => a.variant !== "destructive",
        );
        const destructiveActions = actions.filter(
          (a) => a.variant === "destructive",
        );

        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full min-w-0 flex-col items-end gap-1"
          >
            <div className="flex w-full items-center justify-end">
              <Link
                to="/admin/pesanan/$orderId"
                params={{ orderId: order.code }}
                aria-label={`Lihat detail penuh ${order.code}`}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
              >
                <ArrowUpRightIcon size={12} aria-hidden="true" />
              </Link>
            </div>
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(order, action.id);
                }}
                className="h-6 w-full rounded-md bg-[#111827] px-1.5 text-[11px] font-semibold text-white shadow-2xs transition-all hover:bg-[#27272a] active:scale-[0.98]"
              >
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
            <div className="flex w-full items-center justify-end gap-1">
              {destructiveActions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(order);
                  }}
                  className="h-6 flex-1 rounded-md px-1 text-[11px] font-semibold shadow-2xs"
                >
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(order);
                }}
                className={cn(
                  "h-6 rounded-md px-1 text-[11px] font-semibold text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]",
                  destructiveActions.length > 0
                    ? "flex-1"
                    : primaryActions.length > 0
                      ? "w-full"
                      : "w-full",
                )}
              >
                Lihat
              </Button>
            </div>
          </div>
        );
      },
    }),
  ]);
}
