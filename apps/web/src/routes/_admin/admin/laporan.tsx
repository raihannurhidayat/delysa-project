import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminReportsPage } from "~/features/admin/pages/admin-reports-page";

export const Route = createFileRoute("/_admin/admin/laporan")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Laporan Penjualan — Admin Delysa Florist" }],
  }),
  component: AdminReportsRoute,
});

function AdminReportsRoute() {
  return <AdminReportsPage />;
}
