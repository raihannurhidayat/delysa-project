import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import type { CarouselApi } from "~/components/ui/carousel";

/** Jeda autoplay antar banner promo (ms). Satu-satunya sumber kebenaran. */
export const HERO_AUTOPLAY_DELAY_MS = 7000;

export type UseHeroSliderResult = {
  /** Teruskan ke prop `plugins` Carousel (instance stabil antar render). */
  plugin: ReturnType<typeof Autoplay>;
  /** Teruskan ke prop `setApi` Carousel. */
  setApi: (api: CarouselApi) => void;
  /** Indeks slide aktif (0-based). */
  selected: number;
  /** Jumlah slide. */
  count: number;
  goTo: (index: number) => void;
};

/**
 * State slider hero promo: autoplay 7 detik + loop (di opts Carousel),
 * pause saat hover/focus (plugin), tanpa autoplay untuk reduced-motion.
 */
export function useHeroSlider(slideCount: number): UseHeroSliderResult {
  const [plugin] = React.useState(() =>
    Autoplay({
      delay: HERO_AUTOPLAY_DELAY_MS,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState(0);
  const [count, setCount] = React.useState(slideCount);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelected(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      api.plugins().autoplay?.stop();
    }

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const goTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  return {
    plugin,
    setApi,
    selected,
    count,
    goTo,
  };
}
