import { MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "~/components/ui/button";
import { WHATSAPP_NUMBER } from "~/features/checkout/payment-methods";
import { formatIDR } from "~/features/shop/lib/format";
import { formatOrderDate } from "~/features/shop/lib/order-format";
import {
  getOrderStatusMeta,
  isClosedOrderStatus,
} from "~/features/shop/lib/order-status";
import type { OrderRecord } from "~/features/shop/types";
import { OrderStatusBadge } from "./order-status-badge";
import { CopyOrderCodeButton } from "./copy-order-code-button";

const PRIMARY_ACTION: Record<
  OrderRecord["status"],
  { label: string; action: "open" | "reorder" }
> = {
  pending_payment: { label: "Bayar sekarang", action: "open" },
  pending_verification: { label: "Cek verifikasi", action: "open" },
  paid: { label: "Lihat detail", action: "open" },
  processing: { label: "Lihat progres", action: "open" },
  shipped: { label: "Lacak pesanan", action: "open" },
  delivered: { label: "Pesan lagi", action: "reorder" },
  cancelled: { label: "Lihat detail", action: "open" },
  rejected: { label: "Lihat detail", action: "open" },
};

export function OrderHistoryCard({
  order,
  onOpen,
  onReorder,
}: {
  order: OrderRecord;
  onOpen: (order: OrderRecord) => void;
  onReorder: (order: OrderRecord) => void;
}) {
  const meta = getOrderStatusMeta(order.status);
  const primary = PRIMARY_ACTION[order.status];
  const closed = isClosedOrderStatus(order.status);
  const visibleItems = order.items.slice(0, 2);
  const remaining = order.items.length - visibleItems.length;
  const whatsappMessage = `Halo Delysa Florist, saya ingin bertanya tentang pesanan ${order.code}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#F3F4F6] bg-[#FFFBF7] px-4 py-3">
        <div>
          <div className="flex items-center gap-1">
            <p className="font-mono text-sm font-bold tracking-tight text-[#1A1A1A]">
              {order.code}
            </p>
            <CopyOrderCodeButton code={order.code} />
          </div>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="p-4">
        <p className="text-xs leading-relaxed text-[#6B7280]">
          {meta.description}
        </p>

        <ul className="mt-3 space-y-2.5">
          {visibleItems.map((item) => (
            <li
              key={`${item.slug}-${item.sizeId}-${item.wrapId}`}
              className="flex items-center gap-3"
            >
              <img
                src={item.image}
                alt={item.name}
                className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-[#E5E7EB]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                  {item.name}
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  {item.qty} &times; {formatIDR(item.price)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {remaining > 0 ? (
          <p className="mt-2 text-[11px] font-medium text-[#6B7280]">
            +{remaining} item lainnya
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[#E5E7EB] pt-3">
          <div>
            <p className="text-[11px] text-[#6B7280]">Total pesanan</p>
            <p className="text-base font-extrabold text-[#FF6B35]">
              {formatIDR(order.totals.grandTotal)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {closed ? (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "rounded-lg border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]",
                })}
              >
                <MessageCircle size={13} aria-hidden="true" className="mr-1" />
                Tanya via WhatsApp
              </a>
            ) : null}

            <Button
              type="button"
              size="sm"
              onClick={() =>
                primary.action === "reorder" ? onReorder(order) : onOpen(order)
              }
              className="rounded-lg bg-[#FF6B35] text-xs font-semibold text-[#21140D] hover:bg-[#F25C26]"
            >
              {primary.label}
            </Button>

            {order.status === "delivered" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpen(order)}
                className="rounded-lg border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]"
              >
                Lihat detail
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
