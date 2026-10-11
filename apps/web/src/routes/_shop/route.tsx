import { createFileRoute, Outlet } from "@tanstack/react-router";
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
      <ShopHeader />
      <Outlet />
      <ShopFooter />
    </div>
  );
}
