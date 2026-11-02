import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminOrdersPage } from "~/features/admin/pages/admin-orders-page";

export const Route = createFileRoute("/_admin/admin/pesanan")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Pesanan — Admin Delysa Florist" }],
  }),
  component: AdminOrdersRoute,
});

function AdminOrdersRoute() {
  return <AdminOrdersPage />;
}
