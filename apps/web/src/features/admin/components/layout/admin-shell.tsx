import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AdminSidebar } from "./sidebar/admin-sidebar";

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#C2410C] focus:shadow-lg focus:ring-2 focus:ring-[#FF6B35]"
      >
        Lewati ke konten utama
      </a>
      <AdminSidebar user={user} />
      <SidebarInset id="admin-main" tabIndex={-1} className="bg-[#F8F9FA]">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[#E5E7EB] bg-white/95 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger
            aria-label="Buka atau tutup menu admin"
            className="size-11 md:size-8"
          />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
              Panel
            </p>
            <p className="truncate text-sm font-bold">Dashboard</p>
          </div>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "ml-auto h-11 rounded-lg text-xs font-semibold sm:h-9",
            })}
          >
            <ArrowLeft size={14} aria-hidden="true" className="mr-1.5" />
            Lihat toko
          </Link>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
