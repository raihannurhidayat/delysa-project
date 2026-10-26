"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import type { OrderStatus } from "@delysa/shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button, buttonVariants } from "~/components/ui/button";
import { WHATSAPP_NUMBER } from "~/features/checkout/payment-methods";
import { OrderCodeLookupForm } from "~/features/shop/components/orders/order-code-lookup-form";
import { OrderDeliveryCard } from "~/features/shop/components/orders/order-delivery-card";
import { OrderItemsCard } from "~/features/shop/components/orders/order-items-card";
import { OrderNotFound } from "~/features/shop/components/orders/order-not-found";
import { OrderPaymentCard } from "~/features/shop/components/orders/order-payment-card";
import { OrderStatusSummary } from "~/features/shop/components/orders/order-status-summary";
import { useDemoAuth } from "~/features/shop/hooks/use-demo-auth";
import { useMiniCart } from "~/features/shop/hooks/use-mini-cart";
import { useOrder } from "~/features/shop/hooks/use-orders";
import { updateOrderStatus } from "~/features/shop/lib/order-store";
import { useNavigate } from "@tanstack/react-router";

export function OrderStatusPage({
  code,
  onLookup,
}: {
  code: string;
  onLookup: (code: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const order = useOrder(code);
  const { isCustomer } = useDemoAuth();
  const { add } = useMiniCart();
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={
              <button type="button" onClick={() => navigate({ to: "/" })} />
            }
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            render={
              <button
                type="button"
                onClick={() => navigate({ to: "/riwayat-pesanan" })}
              />
            }
          >
            Riwayat Pesanan
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Status Pesanan</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {breadcrumb}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-[#E5E7EB] bg-white" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {breadcrumb}
        <OrderNotFound code={code} onLookup={onLookup} />
      </div>
    );
  }

  const handleStatusChange = (status: OrderStatus) => {
    updateOrderStatus(order.code, status, {
      note:
        status === "pending_verification"
          ? "Bukti pembayaran diunggah"
          : undefined,
    });
  };

  const handleReorder = () => {
    order.items.forEach((line) => add(line));
    void navigate({ to: "/keranjang" });
  };

  const whatsappMessage = `Halo Delysa Florist, saya ingin bertanya tentang pesanan ${order.code}.`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      {breadcrumb}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <OrderStatusSummary order={order} />
          <OrderItemsCard order={order} />
          <OrderDeliveryCard order={order} isCustomer={isCustomer} />
        </div>

        <div className="space-y-4">
          <OrderPaymentCard order={order} onStatusChange={handleStatusChange} />

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Butuh bantuan atau ingin memesan rangkaian yang sama?
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleReorder}
                className="h-10 w-full rounded-lg bg-[#FF6B35] font-semibold text-[#21140D] hover:bg-[#F25C26]"
              >
                <RotateCcw size={15} aria-hidden="true" className="mr-1.5" />
                Pesan lagi
              </Button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-10 w-full rounded-lg border-[#E5E7EB] bg-white font-semibold text-[#1A1A1A] hover:bg-[#F7F7F8]",
                })}
              >
                <MessageCircle
                  size={15}
                  aria-hidden="true"
                  className="mr-1.5"
                />
                Hubungi admin
              </a>
            </div>
            <div className="mt-4 border-t border-[#E5E7EB] pt-3">
              <p className="text-[11px] font-semibold text-[#4B5563]">
                Lacak pesanan lain
              </p>
              <OrderCodeLookupForm
                className="mt-2"
                initialCode=""
                onSubmit={onLookup}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
