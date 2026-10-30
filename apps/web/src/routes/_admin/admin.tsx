import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin")({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return <Outlet />;
}
