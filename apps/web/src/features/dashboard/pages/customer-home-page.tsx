import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Flower2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";

const ACTIONS = [
  {
    title: "Riwayat pesanan",
    description: "Pantau status, bukti pembayaran, dan pesan ulang.",
    to: "/riwayat-pesanan",
    icon: ShoppingBag,
  },
  {
    title: "Keranjang",
    description: "Lanjutkan rangkaian yang sudah Anda pilih.",
    to: "/keranjang",
    icon: ShoppingCart,
  },
  {
    title: "Jelajahi katalog",
    description: "Temukan buket baru dan promo musiman.",
    to: "/katalog",
    icon: Flower2,
  },
] as const;

export function CustomerHomePage({ user }: { user: AuthUser }) {
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3ED] px-3 py-1 text-[11px] font-semibold text-[#C2410C]">
          <Sparkles size={13} aria-hidden="true" />
          Akun pelanggan
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Halo, {firstName}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          Kelola pesanan dan lanjutkan belanja buket favorit Anda dari satu
          tempat.
        </p>
        <Link
          to="/katalog"
          className={buttonVariants({
            className:
              "mt-4 h-10 rounded-lg bg-[#111111] px-4 text-sm font-semibold text-white hover:bg-[#2A2A2A]",
          })}
        >
          Mulai belanja
          <ArrowRight size={15} aria-hidden="true" className="ml-1.5" />
        </Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.to}
              className="group rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-colors hover:border-[#FDBA74]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <Icon size={17} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-bold">{action.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        Riwayat pesanan pada tahap ini masih memakai data demo lokal. Setelah
        API pesanan tersedia, halaman ini akan memakai data akun Anda.
      </p>
    </div>
  );
}
