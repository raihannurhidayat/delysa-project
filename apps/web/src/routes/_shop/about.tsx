import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/product/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/about")({
  component: AboutRouteComponent,
});

function AboutRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="About"
      description="Cerita atelier Delysa Florist segera hadir di halaman ini."
    />
  );
}
