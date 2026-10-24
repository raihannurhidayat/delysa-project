import type { OrderRecord } from "~/features/shop/types";
import { getOrderStatusMeta } from "~/features/shop/lib/order-status";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { CopyOrderCodeButton } from "./copy-order-code-button";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderStatusTimeline } from "./order-status-timeline";

export function OrderStatusSummary({ order }: { order: OrderRecord }) {
  const meta = getOrderStatusMeta(order.status);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#FF6B35] uppercase">
            Status Pesanan
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-2xl">
            {meta.label}
          </h1>
          <div className="mt-1 flex items-center gap-1">
            <p className="font-mono text-xs font-semibold tracking-wide text-[#4B5563] sm:text-sm">
              {order.code}
            </p>
            <CopyOrderCodeButton code={order.code} />
          </div>
          <p className="mt-1 text-[11px] text-[#6B7280] sm:text-xs">
            Dibuat {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "delivered" && order.deliveredAt ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          Pesanan selesai pada {formatOrderDate(order.deliveredAt)}
        </p>
      ) : null}

      <div className="mt-5 border-t border-[#E5E7EB] pt-4">
        <OrderStatusTimeline events={order.timeline} status={order.status} />
      </div>
    </section>
  );
}
