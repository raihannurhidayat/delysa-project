import { Badge } from "~/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "~/components/ui/drawer";
import { OrderItemsCard } from "~/features/shop/components/orders/order-items-card";
import { OrderPaymentCard } from "~/features/shop/components/orders/order-payment-card";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { OrderStatusTimeline } from "~/features/shop/components/orders/order-status-timeline";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import type { AdminOrderView } from "../../lib/pesanan/admin-order.types";

type DetailChip = {
  label: string;
  className: string;
};

function buildChips(order: AdminOrderView): DetailChip[] {
  const chips: DetailChip[] = [];

  if (order.batch === "unsil") {
    chips.push({
      label: "Wisuda UNSIL",
      className: "bg-[#FFF3ED] text-[#C2410C]",
    });
  }
  if (order.slaBreached) {
    chips.push({
      label: "SLA Lewat Batas",
      className: "bg-[#FEE2E2] text-[#B91C1C]",
    });
  }
  if (order.workbench) {
    chips.push({
      label: order.workbench,
      className: "bg-[#F3F4F6] text-[#4B5563]",
    });
  }
  if (order.courierLabel) {
    chips.push({
      label: order.courierLabel,
      className: "bg-[#DCFCE7] text-[#166534]",
    });
  }

  return chips;
}

/** Drawer detail order: data order asli + chip dummy admin. */
export function AdminOrderDetailDrawer({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrderView | null;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const chips = order ? buildChips(order) : [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="overflow-y-auto">
        {order ? (
          <div className="space-y-4">
            <div>
              <DrawerTitle className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-bold text-[#111111]">
                  {order.code}
                </span>
                <OrderStatusBadge status={order.status} />
              </DrawerTitle>
              <DrawerDescription className="mt-1">
                Dibuat {formatOrderDate(order.createdAt)}
              </DrawerDescription>
            </div>

            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <Badge
                    key={chip.label}
                    className={`border-transparent ${chip.className}`}
                  >
                    {chip.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#FF6B35] uppercase">
                Penerima
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#1A1A1A]">
                {order.recipientName}
              </p>
              <p className="text-xs text-[#6B7280]">{order.recipientPhone}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                {order.shippingAddress}
              </p>
            </section>

            <OrderItemsCard order={order} />
            <OrderPaymentCard
              order={order}
              onStatusChange={() => {}}
            />
            <OrderStatusTimeline
              events={order.timeline}
              status={order.status}
            />
          </div>
        ) : (
          <div>
            <DrawerTitle>Tidak ada pesanan dipilih</DrawerTitle>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
