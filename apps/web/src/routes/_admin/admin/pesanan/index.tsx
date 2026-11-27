import { createFileRoute } from "@tanstack/react-router";
import { AdminOrdersPage } from "~/features/admin/pages/admin-orders-page";

export const Route = createFileRoute("/_admin/admin/pesanan/")({
  head: () => ({
    meta: [{ title: "Pesanan — Admin Delysa Florist" }],
  }),
  component: AdminOrdersRoute,
});

function AdminOrdersRoute() {
  return <AdminOrdersPage />;
}
