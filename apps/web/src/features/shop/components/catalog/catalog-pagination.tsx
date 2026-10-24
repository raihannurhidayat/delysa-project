import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

/**
 * Bar pagination katalog mirip desain referensi: teks info hasil di kiri,
 * kelompok tombol halaman di kanan. Info selalu tampil (termasuk 1 halaman);
 * deret tombol disembunyikan bila hanya 1 halaman.
 */
export function CatalogPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  itemLabel = "produk buket & rangkaian",
  ariaLabel = "Pagination katalog",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  itemLabel?: string;
  ariaLabel?: string;
}) {
  const safeTotal = Math.max(0, total);
  const rawFrom = (page - 1) * pageSize + 1;
  const rawTo = Math.min(page * pageSize, safeTotal);
  const outOfRange = safeTotal === 0 || rawFrom > safeTotal;
  const from = outOfRange ? 0 : rawFrom;
  const to = outOfRange ? 0 : rawTo;

  const pages = getVisiblePages(page, pageCount);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        aria-live="polite"
        className="text-center text-[13px] text-[#6B7280] sm:text-left"
      >
        Menampilkan{" "}
        <span className="font-semibold text-[#1A1A1A]">
          {from} - {to}
        </span>{" "}
        dari <span className="font-semibold text-[#1A1A1A]">{safeTotal}</span>{" "}
        {itemLabel}
      </p>

      {pageCount > 1 && (
        <nav aria-label={ariaLabel}>
          <ul className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <li>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
                aria-label="Halaman sebelumnya"
                className="cursor-pointer h-9 rounded-md border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F8] hover:text-[#1A1A1A] disabled:border-[#EDEFF2] disabled:bg-white disabled:text-[#C9CDD3]"
              >
                Sebelumnya
              </Button>
            </li>
            {pages.map((p, index) =>
              p === "…" ? (
                <li
                  key={`ellipsis-${index}`}
                  aria-hidden="true"
                  className="flex h-9 min-w-9 items-center justify-center px-1 text-[13px] text-[#9AA0AA]"
                >
                  …
                </li>
              ) : (
                <li key={p}>
                  <Button
                    type="button"
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    aria-current={p === page ? "page" : undefined}
                    aria-label={
                      p === page
                        ? `Halaman ${p}, halaman saat ini`
                        : `Ke halaman ${p}`
                    }
                    onClick={() => onPage(p)}
                    className={cn(
                      "h-9 min-w-9 rounded-md border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F8] hover:text-[#1A1A1A]",
                      p === page &&
                        "border-[#111111] bg-[#111111] text-white hover:bg-[#2A2A2A] hover:text-white",
                    )}
                  >
                    {p}
                  </Button>
                </li>
              ),
            )}
            <li>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => onPage(page + 1)}
                aria-label="Halaman berikutnya"
                className="cursor-pointer h-9 rounded-md border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F8] hover:text-[#1A1A1A] disabled:border-[#EDEFF2] disabled:bg-white disabled:text-[#C9CDD3]"
              >
                Selanjutnya
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

/**
 * Deret nomor halaman dengan window agar tidak melebar saat pageCount besar.
 * ≤7 halaman: tampil semua. Lebih dari itu: 1 … window(±1 current) … last.
 */
function getVisiblePages(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const current = Math.min(Math.max(1, page), pageCount);
  const windowed = new Set<number>([
    1,
    pageCount,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...windowed]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev !== 0 && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}
