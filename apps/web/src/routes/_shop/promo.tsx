import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/shop/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/promo")({
  component: PromoRouteComponent,
});

function PromoRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="Promo Spesial"
      description="Promo dan flash sale segera hadir di halaman ini."
    />
  );
}
