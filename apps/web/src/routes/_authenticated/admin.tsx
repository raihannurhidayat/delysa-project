import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminHomePage } from "~/features/dashboard/pages/admin-home-page";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Dasbor Admin — Delysa Florist" }],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const { user } = Route.useRouteContext();

  return <AdminHomePage user={user} />;
}
