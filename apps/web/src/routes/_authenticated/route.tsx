import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "~/features/auth/api/session";
import { AuthenticatedShell } from "~/features/dashboard/components/authenticated-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!user) {
      throw redirect({ to: "/sign-in" });
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AuthenticatedShell user={user}>
      <Outlet />
    </AuthenticatedShell>
  );
}
