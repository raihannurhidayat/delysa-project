import { createFileRoute } from "@tanstack/react-router";
import CartPage from "~/features/shop/view/cart-page";

export const Route = createFileRoute("/_shop/keranjang")({
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
  head: () => ({
    meta: [
      { title: "Keranjang Belanja — Delysa Florist" },
      {
        name: "description",
        content:
          "Kelola rangkaian pilihanmu, atur varian dan jadwal antar, lalu lanjutkan ke pembayaran.",
      },
    ],
  }),
  component: KeranjangRouteComponent,
});

function KeranjangRouteComponent() {
  const { demo } = Route.useSearch();
  return <CartPage demo={demo} />;
}
