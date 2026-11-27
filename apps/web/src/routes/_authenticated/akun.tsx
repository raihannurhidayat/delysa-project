import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { CustomerHomePage } from "~/features/dashboard/pages/customer-home-page";

export const Route = createFileRoute("/_authenticated/akun")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "customer") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Akun Saya — Delysa Florist" }],
  }),
  component: AkunRoute,
});

function AkunRoute() {
  const { user } = Route.useRouteContext();

  return <CustomerHomePage user={user} />;
}
