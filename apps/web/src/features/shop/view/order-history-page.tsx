"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Flower2, Headset, ShieldCheck } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
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
import { useSession } from "~/features/auth/hooks/use-session";
import { roleHome, roleLabel } from "~/features/auth/lib/role-home";
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
  const { user } = useSession();
  const isCustomer = user?.role === "customer";
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

  const handleSignIn = () => {
    void navigate({ to: "/sign-in" });
  };

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
      <OrderHistoryHeader userName={isCustomer ? user?.name : undefined} />

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
      ) : user ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center shadow-sm sm:p-7">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#DBEAFE]">
            <ShieldCheck size={23} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-extrabold tracking-tight text-[#1A1A1A]">
            Riwayat pelanggan tidak tersedia
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#6B7280]">
            Anda masuk sebagai {roleLabel(user.role)}. Riwayat pesanan pelanggan
            hanya dapat dilihat dari akun pelanggan.
          </p>
          <Link
            to={roleHome(user.role)}
            className={buttonVariants({
              className:
                "mt-4 h-10 rounded-lg bg-[#111111] px-4 text-sm font-semibold text-white hover:bg-[#2A2A2A]",
            })}
          >
            Kembali ke dasbor
          </Link>
        </section>
      ) : (
        <OrderHistoryLocked onSignIn={handleSignIn} onLookup={handleLookup} />
      )}

      <TrustStrip items={TRUST_ITEMS} ariaLabel="Keunggulan riwayat pesanan" />
    </div>
  );
}
