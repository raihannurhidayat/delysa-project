import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PromoTopBar } from "~/features/shop/components/storefront/promo-top-bar";
import { ShopFooter } from "~/features/shop/components/storefront/shop-footer";
import { ShopHeader } from "~/features/shop/components/storefront/shop-header";

export const Route = createFileRoute("/_shop")({
  component: ShopLayout,
});

function ShopLayout() {
  // Header/footer persisten: ShopHeader tidak remount saat pindah route
  // sehingga indikator slide beranimasi dari posisi aktif terakhir.
  return (
    <div>
      <PromoTopBar />
      <ShopHeader />
      <Outlet />
      <ShopFooter />
    </div>
  );
}
