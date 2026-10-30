import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "~/features/admin/components/layout/admin-shell";
import { sessionQueryOptions } from "~/features/auth/api/session";
import { roleHome } from "~/features/auth/lib/role-home";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!user) {
      throw redirect({ to: "/sign-in" });
    }

    if (user.role !== "admin") {
      throw redirect({ to: roleHome(user.role) });
    }

    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AdminShell user={user}>
      <Outlet />
    </AdminShell>
  );
}
