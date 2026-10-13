import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft, House } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

export function NotFound({ children }: { children?: ReactNode }) {
  const router = useRouter();

  const goBack = () => {
    router.history.back();
  };

  return (
    <main className="flex max-h-screen flex-col items-center justify-center bg-[#f4f4f5] px-6 py-16 text-center dark:bg-gray-950">
      <p className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-4 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-neutral-800 uppercase dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        <span aria-hidden className="size-2 rounded-full bg-orange-600" />
        Halaman tidak ditemukan • 404
      </p>
      <p
        aria-hidden
        className="mt-10 text-7xl font-bold tracking-tight text-neutral-900 md:text-8xl dark:text-gray-100"
      >
        404
      </p>
      <h1 className="mt-6 max-w-3xl text-4xl leading-[1.15] font-bold text-balance text-neutral-900 dark:text-gray-100">
        Rangkaian yang Anda Cari Tidak Ditemukan
      </h1>
      <div className="mt-6 max-w-xl text-base leading-relaxed text-neutral-500 dark:text-gray-400">
        {children || (
          <p>
            Halaman atau produk botani yang Anda tuju mungkin telah dipindahkan,
            berganti musim, atau tautan yang Anda masukkan kurang tepat. Tenang,
            atelier kami siap memandu Anda kembali ke koleksi segar.
          </p>
        )}
      </div>
      <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Button render={<Link to="/" />}>
          <House aria-hidden className="size-4.5" />
          Kembali ke Halaman Utama
        </Button>
        <Button
          type="button"
          onClick={goBack}
          variant={"outline"}
          className="gap-2.5 cursor-pointer"
        >
          <ArrowLeft aria-hidden className="size-4.5" />
          Kembali ke Halaman Sebelumnya
        </Button>
      </div>
    </main>
  );
}
