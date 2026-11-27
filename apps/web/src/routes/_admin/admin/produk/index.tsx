import { useEffect, useSyncExternalStore } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getAdminProducts,
  refreshAdminProductsFromApi,
  removeAdminProduct,
  setAdminProducts,
  subscribeAdminProducts,
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
  const products = useSyncExternalStore(
    subscribeAdminProducts,
    getAdminProducts,
    getAdminProducts,
  );

  useEffect(() => {
    void refreshAdminProductsFromApi();
  }, []);

  return (
    <AdminProductsPage
      key={products.length === 0 ? "loading" : "ready"}
      initialProducts={products}
      onProductsChange={setAdminProducts}
      onDeleteProduct={(product) => removeAdminProduct(product.id)}
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
