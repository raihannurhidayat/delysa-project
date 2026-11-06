import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";

export const Route = createFileRoute("/_admin/admin/pesanan")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  component: AdminOrdersLayoutRoute,
});

function AdminOrdersLayoutRoute() {
  return <Outlet />;
}
