import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/product/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/shop")({
  component: ShopRouteComponent,
});

function ShopRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="Shop Semua Produk"
      description="Katalog lengkap Delysa Florist segera hadir di halaman ini."
    />
  );
}
