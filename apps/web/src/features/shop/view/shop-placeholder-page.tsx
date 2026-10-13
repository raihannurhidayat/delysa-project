import { Link } from "@tanstack/react-router";

export function ShopPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
        <p className="text-xs font-semibold tracking-wide text-rose-600">
          Delysa Florist
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-balance text-[#1A1A1A] sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-full bg-[#111111] px-5 py-2 text-sm font-bold text-white hover:bg-[#2A2A2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
