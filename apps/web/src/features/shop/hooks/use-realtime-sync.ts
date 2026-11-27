import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { refreshAdminProductsFromApi } from "~/features/admin/lib/products/product-store";
import { API_BASE_URL, isMockMode } from "~/features/shop/api/http";
import { orderQueries, productQueries } from "~/features/shop/api/query-keys";
import { refreshOrdersFromApi } from "~/features/shop/lib/order-store";

/**
 * Sinkronisasi real-time dua lapis saat backend aktif:
 * 1. Server-Sent Events (`GET /api/v1/realtime/stream`) untuk update lintas perangkat/user.
 * 2. BroadcastChannel + focus sync untuk update instan antar-tab di browser yang sama.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined" || isMockMode() || !API_BASE_URL) return;

    const handleTopic = (topic: string) => {
      if (topic === "products") {
        void queryClient.invalidateQueries({ queryKey: productQueries.all });
        void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        void refreshAdminProductsFromApi();
      } else if (topic === "orders") {
        void queryClient.invalidateQueries({ queryKey: orderQueries.all });
        void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        void refreshOrdersFromApi();
      }
    };

    let source: EventSource | null = null;
    if (typeof EventSource !== "undefined") {
      source = new EventSource(`${API_BASE_URL}/realtime/stream`, {
        withCredentials: true,
      });
      source.addEventListener("products", () => handleTopic("products"));
      source.addEventListener("orders", () => handleTopic("orders"));
    }

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("delysa-realtime");
      channel.onmessage = (event: MessageEvent<{ topic?: string }>) => {
        if (event.data?.topic) handleTopic(event.data.topic);
      };
    }

    const handleFocus = () => {
      void queryClient.invalidateQueries({ queryKey: productQueries.all });
      void refreshOrdersFromApi();
      void refreshAdminProductsFromApi();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      source?.close();
      channel?.close();
      window.removeEventListener("focus", handleFocus);
    };
  }, [queryClient]);
}
