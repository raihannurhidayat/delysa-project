import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminProductEditPage } from "~/features/admin/pages/admin-product-edit-page";

export const Route = createFileRoute("/_admin/admin/produk/$productId")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Edit Produk — Admin Delysa Florist" }],
  }),
  component: AdminProductEditRoute,
});

function AdminProductEditRoute() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <AdminProductEditPage
      productId={productId}
      onSuccess={() => void navigate({ to: "/admin/produk" })}
      onCancel={() => void navigate({ to: "/admin/produk" })}
    />
  );
}
