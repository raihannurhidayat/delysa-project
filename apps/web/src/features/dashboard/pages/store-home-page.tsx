import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Store,
} from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";

const ACTIONS = [
  {
    title: "Kelola produk",
    description: "Atur katalog, stok, dan harga rangkaian.",
    icon: Boxes,
  },
  {
    title: "Pesanan masuk",
    description: "Verifikasi pembayaran dan proses pengiriman.",
    icon: ClipboardList,
  },
  {
    title: "Laporan toko",
    description: "Pantau penjualan dan performa produk.",
    icon: BarChart3,
  },
] as const;

export function StoreHomePage({ user }: { user: AuthUser }) {
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold text-[#1D4ED8]">
          <Store size={13} aria-hidden="true" />
          Dasbor pemilik toko
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Selamat datang, {firstName}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          Area operasional toko sedang disiapkan. Sementara itu, Anda tetap
          dapat melihat storefront sebagai pelanggan.
        </p>
        <Link
          to="/"
          className={buttonVariants({
            className:
              "mt-4 h-10 rounded-lg bg-[#111111] px-4 text-sm font-semibold text-white hover:bg-[#2A2A2A]",
          })}
        >
          Buka storefront
          <ArrowRight size={15} aria-hidden="true" className="ml-1.5" />
        </Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.title}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{action.title}</p>
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                  Segera
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                {action.description}
              </p>
            </div>
          );
        })}
      </div>

      <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        Akun pemilik toko dibuat melalui seeder. Fitur pengelolaan produk dan
        pesanan belum termasuk dalam fase autentikasi ini.
      </p>
    </div>
  );
}
