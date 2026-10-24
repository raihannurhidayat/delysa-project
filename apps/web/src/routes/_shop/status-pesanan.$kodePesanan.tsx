import { createFileRoute } from "@tanstack/react-router";
import { OrderStatusPage } from "~/features/shop/view/order-status-page";

export const Route = createFileRoute("/_shop/status-pesanan/$kodePesanan")({
  head: () => ({
    meta: [
      { title: "Status Pesanan — Delysa Florist" },
      { name: "description", content: "Lacak status pesanan Delysa Florist." },
    ],
  }),
  component: StatusRouteComponent,
});

function StatusRouteComponent() {
  const { kodePesanan } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <OrderStatusPage
      code={kodePesanan}
      onLookup={(code) =>
        void navigate({
          to: "/status-pesanan/$kodePesanan",
          params: { kodePesanan: code },
        })
      }
    />
  );
}
