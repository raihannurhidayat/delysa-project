import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "~/features/admin/pages/admin-dashboard-page";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Dasbor Admin — Delysa Florist" }],
  }),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const { user } = Route.useRouteContext();

  return <AdminDashboardPage user={user} />;
}
