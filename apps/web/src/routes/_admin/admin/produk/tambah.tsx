import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminProductCreatePage } from "~/features/admin/pages/admin-product-create-page";

export const Route = createFileRoute("/_admin/admin/produk/tambah")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Tambah Produk Baru — Admin Delysa Florist" }],
  }),
  component: AdminProductCreateRoute,
});

function AdminProductCreateRoute() {
  const navigate = useNavigate();

  return (
    <AdminProductCreatePage
      onSuccess={() => void navigate({ to: "/admin/produk" })}
      onCancel={() => void navigate({ to: "/admin/produk" })}
    />
  );
}
