import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shop")({
  component: ShopLayout,
});

function ShopLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
