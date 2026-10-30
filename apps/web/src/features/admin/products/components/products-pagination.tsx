import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ProductsPagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Navigasi halaman produk"
      className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E7EB] px-4 py-3 sm:flex-row"
    >
      <p className="text-xs text-[#6B7280]">
        Menampilkan {start}–{end} dari {totalItems} produk
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
          className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold"
        >
          <ChevronLeftIcon size={14} aria-hidden="true" />
          Prev
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            aria-label={`Halaman ${p}`}
            aria-current={p === page ? "page" : undefined}
            className="h-8 min-w-8 rounded-lg px-2 text-xs font-semibold"
          >
            {p}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
          className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold"
        >
          Next
          <ChevronRightIcon size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
