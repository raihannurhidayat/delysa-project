import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { StoreHomePage } from "~/features/dashboard/pages/store-home-page";

export const Route = createFileRoute("/_authenticated/toko")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "store_owner") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Dasbor Toko — Delysa Florist" }],
  }),
  component: TokoRoute,
});

function TokoRoute() {
  const { user } = Route.useRouteContext();

  return <StoreHomePage user={user} />;
}
