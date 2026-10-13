import { createFileRoute } from "@tanstack/react-router";
import StorefrontPage from "~/features/shop/view/storefront-page";

export const Route = createFileRoute("/_shop/")({
  // Harness demo 5-state untuk QA/e2e: ?demo=loading|empty|error.
  // Tanpa param → success (mock sync). `demo?` opsional agar Link
  // "/" yang ada tidak wajib membawa search.
  validateSearch: (
    search: Record<string, unknown>,
  ): { demo?: "loading" | "empty" | "error" } => ({
    demo:
      search.demo === "loading" ||
      search.demo === "empty" ||
      search.demo === "error"
        ? search.demo
        : undefined,
  }),
  component: ShopIndexComponent,
});

function ShopIndexComponent() {
  const { demo } = Route.useSearch();
  return <StorefrontPage demo={demo} />;
}
