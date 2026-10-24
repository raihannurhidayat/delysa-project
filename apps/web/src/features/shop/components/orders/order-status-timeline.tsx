import { Check, Circle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { OrderStatus } from "@delysa/shared";
import type { OrderTimelineEvent } from "~/features/shop/types";
import {
  ORDER_FLOW,
  getOrderStatusMeta,
  isClosedOrderStatus,
} from "~/features/shop/lib/order-status";
import { formatOrderDate } from "~/features/shop/lib/order-format";

export function OrderStatusTimeline({
  events,
  status,
}: {
  events: OrderTimelineEvent[];
  status: OrderStatus;
}) {
  const lastFlowIndex = Math.max(
    -1,
    ...events.map((event) =>
      ORDER_FLOW.findIndex((stage) => stage === event.status),
    ),
  );
  const meta = getOrderStatusMeta(status);
  const currentIndex = meta.stepIndex ?? lastFlowIndex;
  const lastEvent = events.at(-1);

  return (
    <div>
      {isClosedOrderStatus(status) ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{meta.label}</AlertTitle>
          <AlertDescription>
            {lastEvent?.note ?? meta.description}
          </AlertDescription>
        </Alert>
      ) : null}

      <ol className="space-y-0">
        {ORDER_FLOW.map((stage, index) => {
          const stageMeta = getOrderStatusMeta(stage);
          const event = events.find((item) => item.status === stage);
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "upcoming";

          return (
            <li
              key={stage}
              data-testid="order-timeline-stage"
              data-state={state}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {index < ORDER_FLOW.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-6 bottom-0 left-[11px] w-px ${
                    state === "done" ? "bg-[#FF6B35]" : "bg-[#E5E7EB]"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ring-1 ${
                  state === "done"
                    ? "bg-[#FF6B35] text-white ring-[#FF6B35]"
                    : state === "current"
                      ? "bg-[#FFF3ED] text-[#C2410C] ring-[#FF6B35]"
                      : "bg-white text-[#9CA3AF] ring-[#E5E7EB]"
                }`}
              >
                {state === "done" ? (
                  <Check size={13} aria-hidden="true" />
                ) : state === "current" ? (
                  <span className="size-2 rounded-full bg-current" />
                ) : (
                  <Circle size={10} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-semibold ${
                    state === "upcoming" ? "text-[#9CA3AF]" : "text-[#1A1A1A]"
                  }`}
                >
                  {stageMeta.label}
                </p>
                {event ? (
                  <time
                    dateTime={event.at}
                    className="mt-0.5 block text-[11px] text-[#6B7280]"
                  >
                    {formatOrderDate(event.at)}
                  </time>
                ) : null}
                {event?.note ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280]">
                    {event.note}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
