import { createFileRoute } from "@tanstack/react-router";
import { orderHistorySearchSchema } from "~/features/shop/schemas/order-history-search-schema";
import { OrderHistoryPage } from "~/features/shop/view/order-history-page";

export const Route = createFileRoute("/_shop/riwayat-pesanan")({
  validateSearch: orderHistorySearchSchema,
  head: () => ({
    meta: [
      { title: "Pesanan Saya — Delysa Florist" },
      {
        name: "description",
        content: "Pantau status dan riwayat pesanan Delysa Florist.",
      },
    ],
  }),
  component: HistoryRouteComponent,
});

function HistoryRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <OrderHistoryPage
      search={search}
      onSearchChange={(patch) =>
        void navigate({
          search: (prev) => ({ ...prev, ...patch }),
          replace: true,
        })
      }
    />
  );
}
