import { Link, useLocation } from "@tanstack/react-router";
import {
  BoxesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PieChartIcon,
  ShoppingCartIcon,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export type AdminNavItem = {
  title: string;
  to?: "/admin";
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS = [
  { title: "Dashboard", to: "/admin", icon: LayoutDashboardIcon },
  { title: "Produk", icon: PackageIcon },
  { title: "Pesanan", icon: ShoppingCartIcon },
  { title: "Stok", icon: BoxesIcon },
  { title: "Laporan", icon: PieChartIcon },
] satisfies readonly AdminNavItem[];

export function AdminNav() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  return (
    <nav aria-label="Menu admin">
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarMenu>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (!item.to) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={item.title}
                    className="h-11 md:h-9"
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>Segera</SidebarMenuBadge>
                </SidebarMenuItem>
              );
            }

            const active = pathname === item.to;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                    />
                  }
                  isActive={active}
                  tooltip={item.title}
                  className="h-11 md:h-9"
                >
                  <Icon aria-hidden="true" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  );
}
