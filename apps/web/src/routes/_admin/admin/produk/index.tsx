import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getAdminProducts,
  setAdminProducts,
} from "~/features/admin/lib/products/product-store";
import { AdminProductsPage } from "~/features/admin/pages/admin-products-page";

export const Route = createFileRoute("/_admin/admin/produk/")({
  head: () => ({
    meta: [{ title: "Produk — Admin Delysa Florist" }],
  }),
  component: AdminProductsRoute,
});

function AdminProductsRoute() {
  const navigate = useNavigate();

  return (
    <AdminProductsPage
      initialProducts={getAdminProducts()}
      onProductsChange={setAdminProducts}
      onAddProduct={() => void navigate({ to: "/admin/produk/tambah" })}
      onEditProduct={(product) =>
        void navigate({
          to: "/admin/produk/$productId",
          params: { productId: String(product.id) },
        })
      }
    />
  );
}
