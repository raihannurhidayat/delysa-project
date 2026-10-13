import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/shop/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/best-sellers")({
  component: BestSellersRouteComponent,
});

function BestSellersRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="Best Sellers"
      description="Produk terlaris minggu ini segera hadir di halaman ini."
    />
  );
}
