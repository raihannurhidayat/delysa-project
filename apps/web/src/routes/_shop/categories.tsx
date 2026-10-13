import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/shop/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/categories")({
  component: CategoriesRouteComponent,
});

function CategoriesRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="Kategori Bunga"
      description="Jelajahi kategori bunga segera hadir di halaman ini."
    />
  );
}
