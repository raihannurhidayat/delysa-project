import { ArrowRight } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { STOREFRONT_HERO } from "~/features/product/data/storefront";

export function HeroSection() {
  return (
    <section
      aria-label="Promo utama"
      className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"
    >
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#111111] text-white">
          <img
            src={STOREFRONT_HERO.image}
            alt="Rangkaian buket Delysa Florist"
            width={1600}
            height={900}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"
          />
          <div className="relative flex min-h-[280px] flex-col justify-center gap-3 p-6 sm:min-h-[320px] sm:p-10">
            <Badge className="w-fit rounded-full bg-rose-600 text-white">
              {STOREFRONT_HERO.eyebrow}
            </Badge>
            <h1 className="max-w-[16ch] text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
              {STOREFRONT_HERO.title}
            </h1>
            <p className="max-w-[44ch] text-sm text-white/80">
              {STOREFRONT_HERO.description}
            </p>
            <div>
              <Button
                type="button"
                onClick={() =>
                  window.alert("Belanja sekarang segera hadir (UI-only)")
                }
                className="rounded-full bg-white text-sm font-bold text-[#111111] hover:bg-[#F1F2F4]"
              >
                Belanja Sekarang
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {STOREFRONT_HERO.sideCards.map((card) => (
            <a
              key={card.title}
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`${card.title} (segera hadir)`}
              className="group relative min-h-[136px] overflow-hidden rounded-2xl bg-[#F1F2F4] lg:min-h-0"
            >
              <img
                src={card.image}
                alt=""
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white">
                <span className="block text-sm font-bold">{card.title}</span>
                <span className="text-xs text-white/80">{card.subtitle}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
