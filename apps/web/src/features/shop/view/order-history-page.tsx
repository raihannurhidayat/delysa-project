"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flower2, Headset, ShieldCheck } from "lucide-react";
import { CatalogPagination } from "~/features/shop/components/catalog/catalog-pagination";
import { OrderHistoryCard } from "~/features/shop/components/orders/order-history-card";
import { OrderHistoryEmpty } from "~/features/shop/components/orders/order-history-empty";
import { OrderHistoryHeader } from "~/features/shop/components/orders/order-history-header";
import { OrderHistoryLocked } from "~/features/shop/components/orders/order-history-locked";
import { OrderHistoryTabs } from "~/features/shop/components/orders/order-history-tabs";
import { OrderHistoryToolbar } from "~/features/shop/components/orders/order-history-toolbar";
import {
  TrustStrip,
  type TrustItem,
} from "~/features/shop/components/storefront/trust-strip";
import { useDemoAuth } from "~/features/shop/hooks/use-demo-auth";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import { useOrders } from "~/features/shop/hooks/use-orders";
import {
  ORDER_HISTORY_PAGE_SIZE,
  countOrdersByTab,
  filterOrders,
  paginateOrders,
  sortOrders,
} from "~/features/shop/lib/order-filters";
import type { OrderHistorySearch } from "~/features/shop/schemas/order-history-search-schema";
import type { OrderRecord } from "~/features/shop/types";

const TRUST_ITEMS: TrustItem[] = [
  {
    title: "Pembayaran aman",
    subtitle: "Verifikasi manual oleh admin",
    icon: ShieldCheck,
  },
  {
    title: "Bunga segar",
    subtitle: "Dirangkai hari pengiriman",
    icon: Flower2,
  },
  {
    title: "Bantuan cepat",
    subtitle: "WhatsApp admin responsif",
    icon: Headset,
  },
];

export function OrderHistoryPage({
  search,
  onSearchChange,
}: {
  search: OrderHistorySearch;
  onSearchChange: (patch: Partial<OrderHistorySearch>) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { orders } = useOrders();
  const { isCustomer, setMode } = useDemoAuth();
  const { add } = useMiniCart();
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  const openOrder = (code: string) => {
    void navigate({
      to: "/status-pesanan/$kodePesanan",
      params: { kodePesanan: code },
    });
  };

  const handleOpen = (order: OrderRecord) => openOrder(order.code);

  const handleReorder = (order: OrderRecord) => {
    order.items.forEach((line) => add(line));
    void navigate({ to: "/keranjang" });
  };

  const handleLookup = (code: string) => openOrder(code);

  const handleEnableDemo = () => setMode("customer");

  const handleBrowse = () => {
    void navigate({ to: "/katalog" });
  };

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <div className="h-28 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
        <div className="h-16 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const now = new Date();
  const counts = countOrdersByTab(
    orders,
    { q: search.q, period: search.period },
    now,
  );
  const filtered = filterOrders(orders, search, now);
  const sorted = sortOrders(filtered, search.sort);
  const page = paginateOrders(sorted, search.page, ORDER_HISTORY_PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <OrderHistoryHeader isCustomer={isCustomer} />

      {isCustomer ? (
        <>
          <OrderHistoryToolbar
            q={search.q}
            period={search.period}
            sort={search.sort}
            resultCount={page.total}
            onChange={onSearchChange}
          />

          <div className="space-y-4">
            <OrderHistoryTabs
              value={search.status}
              counts={counts}
              onChange={(status) => onSearchChange({ status, page: 1 })}
            />

            {page.total === 0 ? (
              <OrderHistoryEmpty
                onBrowse={handleBrowse}
                onLookup={handleLookup}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {page.items.map((order) => (
                  <OrderHistoryCard
                    key={order.code}
                    order={order}
                    onOpen={handleOpen}
                    onReorder={handleReorder}
                  />
                ))}
              </div>
            )}

            {page.total > 0 ? (
              <CatalogPagination
                page={page.page}
                pageCount={page.pageCount}
                total={page.total}
                pageSize={ORDER_HISTORY_PAGE_SIZE}
                onPage={(nextPage) => onSearchChange({ page: nextPage })}
                itemLabel="pesanan"
                ariaLabel="Pagination riwayat pesanan"
              />
            ) : null}
          </div>
        </>
      ) : (
        <OrderHistoryLocked
          onEnableDemo={handleEnableDemo}
          onLookup={handleLookup}
        />
      )}

      <TrustStrip items={TRUST_ITEMS} ariaLabel="Keunggulan riwayat pesanan" />
    </div>
  );
}
