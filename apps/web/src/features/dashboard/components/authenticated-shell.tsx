import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Flower2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { Button, buttonVariants } from "~/components/ui/button";
import { authErrorMessage } from "~/features/auth/lib/auth-errors";
import { roleHome, roleLabel } from "~/features/auth/lib/role-home";
import { useLogout } from "~/features/auth/hooks/use-logout";
import { ApiError } from "~/features/shop/api/http";

export function AuthenticatedShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const home = roleHome(user.role);
  const isCustomer = user.role === "customer";
  const navigate = useNavigate();
  const { logoutAsync, isPending } = useLogout();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logoutAsync();
      void navigate({ to: "/sign-in", replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }
      setLogoutError(authErrorMessage(error, "login"));
    }
  };

  return (
    <div className="min-h-dvh bg-[#F8F9FA] text-[#1A1A1A]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={home}
              className="inline-flex items-center gap-2 font-extrabold tracking-tight"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <Flower2 size={18} aria-hidden="true" />
              </span>
              DELYSA FLORIST
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1 text-[11px] font-semibold text-[#4B5563]">
              {isCustomer ? (
                <UserRound size={12} aria-hidden="true" />
              ) : (
                <ShieldCheck size={12} aria-hidden="true" />
              )}
              {roleLabel(user.role)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={home}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "h-9 rounded-lg text-xs font-semibold",
              })}
            >
              <LayoutDashboard
                size={14}
                aria-hidden="true"
                className="mr-1.5"
              />
              Dasbor
            </Link>
            {isCustomer ? (
              <Link
                to="/riwayat-pesanan"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "h-9 rounded-lg text-xs font-semibold",
                })}
              >
                <ShoppingBag size={14} aria-hidden="true" className="mr-1.5" />
                Pesanan Saya
              </Link>
            ) : null}
            <Link
              to="/"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-9 rounded-lg text-xs font-semibold",
              })}
            >
              <ArrowLeft size={14} aria-hidden="true" className="mr-1.5" />
              Lihat Toko
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => void handleLogout()}
              className="hidden h-9 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] lg:inline-flex"
            >
              <LogOut size={14} aria-hidden="true" className="mr-1.5" />
              {isPending ? "Keluar..." : "Keluar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9CA3AF] uppercase">
            Akun
          </p>
          <p className="mt-1 truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-[#6B7280]">{user.email}</p>

          <nav aria-label="Navigasi akun" className="mt-4 space-y-1">
            <Link
              to={home}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-[#FFF3ED] text-[#C2410C]" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#4B5563] transition-colors hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            >
              <LayoutDashboard size={14} aria-hidden="true" />
              Ringkasan
            </Link>
            {isCustomer ? (
              <Link
                to="/riwayat-pesanan"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#4B5563] transition-colors hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
              >
                <ShoppingBag size={14} aria-hidden="true" />
                Riwayat Pesanan
              </Link>
            ) : null}
          </nav>

          <div className="mt-5 border-t border-[#F1F2F4] pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] disabled:opacity-60"
            >
              <LogOut size={14} aria-hidden="true" />
              {isPending ? "Keluar..." : "Keluar dari akun"}
            </button>
            {logoutError ? (
              <p role="alert" className="mt-2 px-3 text-[11px] text-[#B91C1C]">
                {logoutError}
              </p>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
