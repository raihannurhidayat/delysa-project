import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PromoTopBar } from "~/features/shop/components/storefront/promo-top-bar";
import { ShopFooter } from "~/features/shop/components/storefront/shop-footer";
import { ShopHeader } from "~/features/shop/components/storefront/shop-header";
import { Toaster } from "~/components/ui/toast";

export const Route = createFileRoute("/_shop")({
  component: ShopLayout,
});

function ShopLayout() {
  return (
    <Toaster>
      <div>
        <PromoTopBar />
        <ShopHeader />
        <Outlet />
        <ShopFooter />
      </div>
    </Toaster>
  );
}
