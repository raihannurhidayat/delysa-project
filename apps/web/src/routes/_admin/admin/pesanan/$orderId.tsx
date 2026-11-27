import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminOrderDetailPage } from "~/features/admin/pages/admin-order-detail-page";

export const Route = createFileRoute("/_admin/admin/pesanan/$orderId")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Detail Pesanan — Admin Delysa Florist" }],
  }),
  component: AdminOrderDetailPage,
});

function AdminOrderDetailRoute() {
  return <AdminOrderDetailPage />;
}
