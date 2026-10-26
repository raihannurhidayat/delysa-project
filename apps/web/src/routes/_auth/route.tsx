import {
  createFileRoute,
  isRedirect,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { sessionQueryOptions } from "~/features/auth/api/session";
import { roleHome } from "~/features/auth/lib/role-home";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    try {
      const user =
        await context.queryClient.ensureQueryData(sessionQueryOptions);
      if (user) {
        throw redirect({ to: roleHome(user.role) });
      }
    } catch (error) {
      if (isRedirect(error)) throw error;
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
