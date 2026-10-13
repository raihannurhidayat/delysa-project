import { createFileRoute } from "@tanstack/react-router";
import CatalogPage from "~/features/shop/view/catalog-page";

export const Route = createFileRoute("/_shop/katalog")({
  component: CatalogPage,
});
