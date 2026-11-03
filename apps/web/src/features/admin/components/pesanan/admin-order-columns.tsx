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
    <Badge className="inline-flex items-center gap-1 rounded-full border border-[#FED7AA] bg-[#FFF3ED] px-2 py-0.5 text-[10px] font-semibold text-[#C2410C]">
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
            className="max-w-full truncate font-mono text-xs font-bold text-[#111111] transition-colors hover:text-[#C2410C] hover:underline"
          >
            {row.original.code}
          </button>
          <p className="text-[11px] font-medium text-[#6B7280]">
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
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-xs font-semibold text-[#1A1A1A] sm:text-sm">
            {row.original.recipientName}
          </p>
          <p className="font-mono text-[11px] text-[#6B7280]">
            {row.original.recipientPhone}
          </p>
          <p
            className="max-w-[14rem] truncate text-[11px] text-[#9CA3AF]"
            title={row.original.shippingAddress}
          >
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
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-bold text-[#1A1A1A] sm:text-sm">
            {formatIDR(row.original.totals.grandTotal)}
          </p>
          <p
            className="max-w-[14rem] truncate text-[11px] text-[#6B7280]"
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
            <p className="text-xs font-semibold text-[#111827]">{methodName}</p>
            <p className="text-[11px] text-[#6B7280]">
              {subLabel === methodName ? "Pembayaran Instan" : subLabel}
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
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-[#374151]">
            {formatRelativeAge(new Date(), row.original.createdAt)}
          </p>
          <div className="flex flex-wrap gap-1">
            {row.original.workbench ? (
              <span className="inline-flex items-center rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#4B5563]">
                {row.original.workbench}
              </span>
            ) : null}
            {row.original.courierLabel ? (
              <span className="inline-flex items-center rounded-md bg-[#ECFDF5] px-1.5 py-0.5 text-[10px] font-medium text-[#047857]">
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
        <div className="flex flex-col items-start gap-1">
          <OrderStatusBadge status={row.original.status} />
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
          <div className="flex min-w-[130px] flex-col items-end gap-1.5">
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="sm"
                onClick={() => onAction(order, action.id)}
                className="h-7 w-full rounded-lg bg-[#111827] px-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#27272a] active:scale-[0.98]"
              >
                {action.label}
              </Button>
            ))}
            <div className="flex w-full items-center justify-end gap-1.5">
              {destructiveActions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(order)}
                  className="h-7 flex-1 rounded-lg px-2 text-xs font-semibold shadow-xs"
                >
                  {action.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onView(order)}
                className={cn(
                  "h-7 rounded-lg px-2.5 text-xs font-semibold text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]",
                  destructiveActions.length > 0
                    ? "flex-1"
                    : primaryActions.length > 0
                      ? "w-full"
                      : "w-auto min-w-[76px]",
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
