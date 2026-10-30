import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminProductsPage } from "~/features/admin/products/pages/admin-products-page";

export const Route = createFileRoute("/_authenticated/admin/produk")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Produk — Admin Delysa Florist" }],
  }),
  component: AdminProductsRoute,
});

function AdminProductsRoute() {
  return <AdminProductsPage />;
}
