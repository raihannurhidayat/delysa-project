import { createFileRoute } from "@tanstack/react-router";
import { ShopPlaceholderPage } from "~/features/product/view/shop-placeholder-page";

export const Route = createFileRoute("/_shop/new-arrivals")({
  component: NewArrivalsRouteComponent,
});

function NewArrivalsRouteComponent() {
  return (
    <ShopPlaceholderPage
      title="New Arrivals"
      description="Koleksi terbaru atelier segera hadir di halaman ini."
    />
  );
}
