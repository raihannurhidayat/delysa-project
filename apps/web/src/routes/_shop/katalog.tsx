import { createFileRoute } from "@tanstack/react-router";
import { catalogSearchSchema } from "~/features/shop/schemas/catalog-query-schema";
import CatalogPage from "~/features/shop/view/catalog-page";

export const Route = createFileRoute("/_shop/katalog")({
  // Harness demo untuk QA: ?demo=loading|empty|error (pola index.tsx).
  // Param tak valid jatuh ke default skema, bukan error boundary.
  validateSearch: catalogSearchSchema,
  component: KatalogRouteComponent,
});

function KatalogRouteComponent() {
  const search = Route.useSearch();
  return <CatalogPage query={search} />;
}
