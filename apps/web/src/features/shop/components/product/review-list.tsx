import { useState } from "react";
import { Lock, Star, ThumbsUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ProductReviewItem } from "~/features/shop/types";
import { cn } from "~/lib/utils";

const FILTERS = [
  "Semua",
  "Dengan Foto",
  "Wisuda UNSIL",
  "Anniversary",
] as const;

/**
 * Daftar ulasan PDP: chips filter + sort + kartu verified + Tulis Ulasan
 * (visual-only: guard auth + pernah-beli hanya indikasi).
 */
export function ReviewList({ reviews }: { reviews: ProductReviewItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Semua");
  const [sort, setSort] = useState("membantu");

  return (
    <div id="ulasan" className="scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter ulasan"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-xs cursor-pointer border px-3 py-1.5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600",
                filter === f
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#9CA3AF]",
              )}
            >
              {f}
              {f === "Semua" ? ` (${reviews.length || 348})` : ""}
            </button>
          ))}
        </div>
        <Label className="w-full flex-col items-stretch gap-1.5 text-[11px] font-semibold tracking-wide text-[#6B7280] uppercase">
          Urutkan:
          <Select
            defaultValue="Paling Membantu"
            onValueChange={(v) => setSort(v ?? "Paling Membantu")}
          >
            <SelectTrigger
              aria-label="Urutkan ulasan"
              className="h-10 w-full rounded-xs border-[#E5E7EB] bg-white px-3 text-xs font-medium normal-case text-[#1A1A1A]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xs">
              <SelectGroup>
                <SelectItem
                  className="rounded-xs text-xs"
                  value="Paling Membantu"
                >
                  Paling Membantu
                </SelectItem>
                <SelectItem className="rounded-xs text-xs" value="Terbaru">
                  Terbaru
                </SelectItem>
                <SelectItem
                  className="rounded-xs text-xs"
                  value="Rating Tertinggi"
                >
                  Rating Tertinggi
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Label>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[11px] font-bold text-white"
              >
                {r.initials}
              </span>
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">
                  {r.name}{" "}
                  <span className="font-normal text-emerald-700">
                    • Pembelian Terverifikasi Tasikmalaya
                  </span>
                </p>
                <p className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                  <span
                    className="flex"
                    aria-label={`Rating ${r.rating} dari 5`}
                  >
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        aria-hidden="true"
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </span>
                  • {r.date} • Varian: {r.variant}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#1A1A1A]">
              “{r.text}”
            </p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-[#6B7280]">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp size={12} aria-hidden="true" />
                Membantu ({r.helpful})
              </span>
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                aria-label={`Laporkan ulasan ${r.name} (segera hadir)`}
              >
                Laporkan
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled
          aria-disabled="true"
          title="Masuk dan selesaikan pembelian untuk menulis ulasan"
          className="rounded-full"
        >
          <Lock size={14} aria-hidden="true" />
          Tulis Ulasan
        </Button>
      </div>
    </div>
  );
}
