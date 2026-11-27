import { createFileRoute } from "@tanstack/react-router";
import { checkoutSearchSchema } from "~/features/shop/schemas/checkout-schema";
import { CheckoutPage } from "~/features/shop/view/checkout-page";
import type { CheckoutStep } from "~/features/shop/types";

export const Route = createFileRoute("/_shop/checkout")({
  validateSearch: checkoutSearchSchema,
  head: () => ({
    meta: [
      { title: "Checkout — Delysa Florist" },
      {
        name: "description",
        content:
          "Selesaikan pesanan rangkaian bunga Delysa Florist dalam 4 langkah: review keranjang, alamat, metode bayar, dan ringkasan.",
      },
    ],
  }),
  component: CheckoutRouteComponent,
});

function CheckoutRouteComponent() {
  const { step } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <CheckoutPage
      step={step}
      onStepChange={(next: CheckoutStep) => {
        void navigate({ search: { step: next } });
      }}
    />
  );
}
