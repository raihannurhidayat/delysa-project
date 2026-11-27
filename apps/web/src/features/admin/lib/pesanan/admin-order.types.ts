import type { OrderTab } from "~/features/shop/types";
import type { OrderRecord } from "~/features/shop/types";

/** Batch wisuda yang dipahami iterasi ini. Sumber PRD menyusul; saat ini digenerate dari hash kode. */
export type AdminOrderBatch = "unsil";

/**
 * View order untuk halaman admin: `OrderRecord` (satu sumber kebenaran dari
 * order-store shop) + field dummy deterministik yang dihitung di layer admin
 * (lihat `admin-order-enrichment.ts`). Field dummy tidak dipersist.
 */
export type AdminOrderView = OrderRecord & {
  batch?: AdminOrderBatch;
  priority: "prioritas" | "normal";
  slaBreached: boolean;
  workbench?: string;
  courierLabel?: string;
  paymentKind: "manual" | "instant" | "invoice";
};

export type AdminOrderPeriod = "today" | "7d" | "all";

export type AdminOrderFilters = {
  search: string;
  statusTab: OrderTab;
  period: AdminOrderPeriod;
  batch: "all" | AdminOrderBatch;
};
