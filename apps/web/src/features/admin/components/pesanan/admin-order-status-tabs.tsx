import { Tabs, TabsList, TabsTab } from "~/components/ui/tabs";
import { cn } from "cn";
import {
  ADMIN_TAB_LABELS,
  ORDER_TABS,
} from "../../lib/pesanan/admin-order-filters";
import type { OrderTab } from "~/features/shop/types";

/** Tab filter status pesanan dengan badge count, responsif tanpa scroll. */
export function AdminOrderStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: OrderTab;
  counts: Record<OrderTab, number>;
  onChange(tab: OrderTab): void;
}) {
  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={(next) => onChange(next as OrderTab)}>
        <TabsList
          aria-label="Filter status pesanan"
          className="flex w-full flex-wrap items-center gap-1.5 border-b-0 sm:gap-2"
        >
          {ORDER_TABS.map((tab) => {
            const isActive = value === tab.value;
            return (
              <TabsTab
                key={tab.value}
                value={tab.value}
                data-active={isActive || undefined}
                className={cn(
                  "-mb-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "border-[#BE185D] bg-[#FDF2F8] text-[#9D174D] shadow-xs"
                    : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#BE185D]/40 hover:bg-[#FDF2F8] hover:text-[#9D174D]",
                )}
              >
                <span>{ADMIN_TAB_LABELS[tab.value]}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                    isActive
                      ? "bg-[#BE185D] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280]",
                  )}
                >
                  {counts[tab.value]}
                </span>
              </TabsTab>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
