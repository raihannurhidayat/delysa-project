import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PromoTopBar } from "~/features/product/components/promo-top-bar";
import { ShopFooter } from "~/features/product/components/shop-footer";
import { ShopHeader } from "~/features/product/components/shop-header";

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
