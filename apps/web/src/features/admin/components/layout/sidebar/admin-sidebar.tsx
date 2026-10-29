import type { AuthUser } from "@delysa/shared";
import { Flower2Icon, XIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import { AdminNav } from "./admin-nav";
import { AdminUserMenu } from "./admin-user-menu";

export function AdminSidebar({ user }: { user: AuthUser }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-2">
        <Link
          to="/admin"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Flower2Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="grid min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-extrabold tracking-tight">
              DELYSA
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60">
              Admin
            </span>
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-11 md:hidden"
          aria-label="Tutup menu admin"
          onClick={() => setOpenMobile(false)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <AdminNav />
      </SidebarContent>
      <SidebarFooter>
        <AdminUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
