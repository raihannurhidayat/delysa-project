import { createFileRoute } from "@tanstack/react-router";
import StorefrontPage from "~/features/product/view/storefront-page";
export const Route = createFileRoute("/_shop/")({
  component: StorefrontPage,
});
