import { Star } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { SectionHeader } from "~/features/shop/components/storefront/section-header";
import { STOREFRONT_REVIEWS } from "~/features/shop/data/storefront";

export function Testimonials() {
  const reviews = STOREFRONT_REVIEWS;

  return (
    <section
      aria-label="Ulasan pelanggan"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"
    >
      <SectionHeader eyebrow="Testimoni" title="Ulasan Pelanggan Tasikmalaya" />
      <div className="grid gap-3 md:grid-cols-3">
        {reviews.map((review) => (
          <Card key={review.name} className="rounded-2xl" size="sm">
            <CardContent className="flex flex-col gap-2">
              <span
                aria-label={`Rating ${review.rating} dari 5`}
                className="flex gap-0.5"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    aria-hidden="true"
                    className={
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-[#D1D5DB]"
                    }
                  />
                ))}
              </span>
              <p className="text-[13px] leading-relaxed text-[#374151]">
                “{review.text}”
              </p>
              <p className="text-xs font-bold text-[#1A1A1A]">{review.name}</p>
              <p className="text-[11px] text-[#6B7280]">{review.product}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
