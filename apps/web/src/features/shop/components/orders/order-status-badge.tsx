import type * as React from "react";
import { cn } from "cn";
import type { OrderStatus } from "@delysa/shared";
import {
  getOrderStatusMeta,
  type OrderStatusTone,
} from "~/features/shop/lib/order-status";

const TONE_CLASSES: Record<OrderStatusTone, string> = {
  warning: "bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]/20",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  neutral: "bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]",
};

export function OrderStatusBadge({
  status,
  className,
  ...props
}: React.ComponentProps<"span"> & { status: OrderStatus }) {
  const meta = getOrderStatusMeta(status);

  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        TONE_CLASSES[meta.tone],
        className,
      )}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
