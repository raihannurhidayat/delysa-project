import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return <Outlet />;
}
