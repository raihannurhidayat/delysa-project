import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * Pagination bernomor katalog. Disembunyikan bila hanya 1 halaman.
 */
export function CatalogPagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination katalog"
      className="flex items-center justify-center gap-1.5"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-full"
      >
        Sebelumnya
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          type="button"
          variant={p === page ? "default" : "outline"}
          size="sm"
          aria-current={p === page ? "page" : undefined}
          aria-label={`Halaman ${p}`}
          onClick={() => onPage(p)}
          className={cn(
            "size-8 rounded-full px-0",
            p === page && "bg-[#111111] text-white hover:bg-[#2A2A2A]",
          )}
        >
          {p}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
        className="rounded-full"
      >
        Selanjutnya
      </Button>
    </nav>
  );
}
