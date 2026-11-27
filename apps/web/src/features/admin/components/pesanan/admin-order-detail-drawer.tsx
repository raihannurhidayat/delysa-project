import { CalendarIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Link } from "@tanstack/react-router";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "~/components/ui/drawer";
import { CopyOrderCodeButton } from "~/features/shop/components/orders/copy-order-code-button";
import { OrderItemsCard } from "~/features/shop/components/orders/order-items-card";
import { OrderPaymentCard } from "~/features/shop/components/orders/order-payment-card";
import { OrderStatusBadge } from "~/features/shop/components/orders/order-status-badge";
import { OrderStatusTimeline } from "~/features/shop/components/orders/order-status-timeline";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import { cn } from "cn";
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
      className: "border-[#FED7AA] bg-[#FDF2F8] text-[#9D174D]",
    });
  }
  if (order.slaBreached) {
    chips.push({
      label: "SLA Lewat Batas",
      className: "border-rose-200 bg-[#FEE2E2] text-[#B91C1C]",
    });
  }
  if (order.workbench) {
    chips.push({
      label: order.workbench,
      className: "border-gray-200 bg-[#F3F4F6] text-[#4B5563]",
    });
  }
  if (order.courierLabel) {
    chips.push({
      label: order.courierLabel,
      className: "border-emerald-200 bg-[#DCFCE7] text-[#166534]",
    });
  }

  return chips;
}

/** Drawer detail order: data order asli + layout bersih & terstruktur. */
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
      <DrawerContent className="w-full sm:max-w-lg md:max-w-xl">
        {order ? (
          <div className="flex h-full min-h-0 flex-col">
            {/* Header Drawer */}
            <div className="shrink-0 border-b border-[#E5E7EB] pb-4 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <DrawerTitle className="font-mono text-lg font-bold text-[#111111]">
                  {order.code}
                </DrawerTitle>
                <CopyOrderCodeButton
                  code={order.code}
                  className="size-7 text-[#6B7280] hover:text-[#111111]"
                />
                <OrderStatusBadge status={order.status} />
                <Link
                  to="/admin/pesanan/$orderId"
                  params={{ orderId: order.code }}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#4B5563] shadow-sm transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
                >
                  Buka halaman detail
                </Link>
              </div>
              <DrawerDescription className="mt-1 flex items-center gap-1.5 text-xs text-[#6B7280]">
                <CalendarIcon
                  size={13}
                  aria-hidden="true"
                  className="text-[#9CA3AF]"
                />
                <span>Dibuat {formatOrderDate(order.createdAt)}</span>
              </DrawerDescription>

              {chips.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <Badge
                      key={chip.label}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        chip.className,
                      )}
                    >
                      {chip.label}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Konten Scrollable */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 pt-4">
              {/* Card Penerima & Alamat */}
              <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#BE185D] uppercase">
                  <MapPinIcon size={13} aria-hidden="true" />
                  <span>Penerima &amp; Pengiriman</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {order.recipientName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-[#6B7280]">
                      <PhoneIcon
                        size={12}
                        className="text-[#9CA3AF]"
                        aria-hidden="true"
                      />
                      <span>{order.recipientPhone}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-3 text-xs leading-relaxed text-[#4B5563]">
                    <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                      Alamat Pengiriman
                    </p>
                    <p>{order.shippingAddress}</p>
                  </div>
                </div>
              </section>

              <OrderItemsCard order={order} />
              <OrderPaymentCard order={order} onStatusChange={() => {}} />
              <OrderStatusTimeline
                events={order.timeline}
                status={order.status}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <DrawerTitle className="text-sm font-semibold text-[#6B7280]">
              Tidak ada pesanan dipilih
            </DrawerTitle>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
