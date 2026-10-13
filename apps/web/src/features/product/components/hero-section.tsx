import { ArrowRight } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/components/ui/carousel";
import {
  STOREFRONT_HERO,
  STOREFRONT_HERO_SLIDES,
} from "~/features/product/data/storefront";
import { useHeroSlider } from "~/features/product/hooks/use-hero-slider";

export function HeroSection() {
  const slider = useHeroSlider(STOREFRONT_HERO_SLIDES.length);

  return (
    <section
      aria-label="Promo utama"
      className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"
    >
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Carousel
          opts={{ loop: true }}
          plugins={[slider.plugin]}
          setApi={slider.setApi}
          className="relative overflow-hidden rounded-2xl bg-[#111111] text-white"
        >
          <CarouselContent className="ml-0">
            {STOREFRONT_HERO_SLIDES.map((slide, i) => {
              const isActive = i === slider.selected;
              const TitleTag = i === 0 ? "h1" : "p";
              return (
                <CarouselItem
                  key={slide.title}
                  aria-label={`${i + 1} dari ${slider.count}`}
                  aria-hidden={!isActive}
                  className="relative min-h-[280px] pl-0 sm:min-h-[320px]"
                >
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    width={1600}
                    height={900}
                    fetchPriority={i === 0 ? "high" : undefined}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    aria-hidden={!isActive}
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"
                  />
                  <div className="relative flex min-h-[280px] flex-col justify-center gap-3 p-6 sm:min-h-[320px] sm:p-10">
                    <Badge className="w-fit rounded-full bg-rose-600 text-white">
                      {slide.eyebrow}
                    </Badge>
                    <TitleTag className="max-w-[16ch] text-3xl leading-[1.12] font-extrabold tracking-tight text-balance sm:text-4xl">
                      {slide.title}
                    </TitleTag>
                    <p className="max-w-[44ch] text-sm text-white/80">
                      {slide.description}
                    </p>
                    <div>
                      <Button
                        type="button"
                        tabIndex={isActive ? undefined : -1}
                        onClick={() =>
                          window.alert(
                            "Belanja sekarang segera hadir (UI-only)",
                          )
                        }
                        className="rounded-md bg-white text-sm font-bold text-[#111111] hover:bg-[#F1F2F4]"
                      >
                        Belanja Sekarang
                        <ArrowRight size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-md bg-black/45 px-3 py-2.5 backdrop-blur-sm">
            {STOREFRONT_HERO_SLIDES.map((slide, i) => {
              const isActive = i === slider.selected;
              return (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => slider.goTo(i)}
                  aria-label={`Ke banner ${i + 1}: ${slide.title}`}
                  aria-current={isActive}
                  className={`h-2 w-8 rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    isActive ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              );
            })}
          </div>
        </Carousel>
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
