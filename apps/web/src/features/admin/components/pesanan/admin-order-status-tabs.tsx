import { Tabs, TabsList, TabsTab } from "~/components/ui/tabs";
import { cn } from "cn";
import {
  ADMIN_TAB_LABELS,
  ORDER_TABS,
} from "../../lib/pesanan/admin-order-filters";
import type { OrderTab } from "~/features/shop/types";

/** Rail tab status: 8 tab dengan count, scroll-x di layar kecil. */
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
    <div className="overflow-x-auto">
      <Tabs value={value} onValueChange={(next) => onChange(next as OrderTab)}>
        <TabsList
          aria-label="Filter status pesanan"
          className="min-w-max gap-0 sm:gap-1"
        >
          {ORDER_TABS.map((tab) => (
            <TabsTab
              key={tab.value}
              value={tab.value}
              data-active={value === tab.value || undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-none px-3 py-2.5 text-xs",
                "data-[active]:border-[#FF6B35] data-[active]:text-[#C2410C]",
              )}
            >
              {ADMIN_TAB_LABELS[tab.value]}
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  value === tab.value
                    ? "bg-[#FFF3ED] text-[#C2410C]"
                    : "bg-[#F3F4F6] text-[#6B7280]",
                )}
              >
                {counts[tab.value]}
              </span>
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
