import * as React from "react";

export type SlidingIndicatorBox = {
  x: number;
  width: number;
};

export type UseSlidingIndicatorOptions = {
  /** Nilai yang berubah saat item aktif berganti (mis. pathname). */
  value?: string | null;
};

export type UseSlidingIndicatorResult = {
  /** Pasang pada elemen list yang menjadi offsetParent indikator. */
  listRef: React.RefObject<HTMLDivElement | null>;
  /** Pasang pada tiap item; hanya item dengan `active=true` yang direkam. */
  itemRef: (active: boolean) => (node: HTMLElement | null) => void;
  /** False sampai pengukuran pertama berhasil (indikator harus disembunyikan). */
  ready: boolean;
  /** Inline style untuk indikator: translate + lebar, atau opacity 0. */
  style: React.CSSProperties;
};

/**
 * Satu indikator geser untuk navigasi: mengukur offset box item aktif
 * (bukan rect terhadap viewport, agar aman dari scroll/transform ancestor),
 * lalu memosisikan indikator via transform. Diukur ulang saat `value`
 * berubah, saat resize (termasuk font swap), dan saat font selesai dimuat.
 */
export function useSlidingIndicator({
  value,
}: UseSlidingIndicatorOptions = {}): UseSlidingIndicatorResult {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef<HTMLElement | null>(null);
  const firstValueRef = React.useRef(true);
  const [box, setBox] = React.useState<SlidingIndicatorBox | null>(null);

  const measure = React.useCallback(() => {
    const node = activeRef.current;
    if (!node || !node.isConnected) {
      setBox(null);
      return;
    }
    const next = { x: node.offsetLeft, width: node.offsetWidth };
    setBox((prev) =>
      prev && prev.x === next.x && prev.width === next.width ? prev : next,
    );
  }, []);

  // Ref callback mencatat node aktif; pengukuran dilakukan di layout effect
  // setelah React commit DOM agar class aktif (mis. bold) sudah diterapkan.
  const itemRef = React.useCallback(
    (active: boolean) => (node: HTMLElement | null) => {
      if (active) activeRef.current = node;
    },
    [],
  );

  React.useLayoutEffect(() => {
    measure();
  }, [measure, value]);

  React.useEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    if (listRef.current) observer.observe(listRef.current);
    if (activeRef.current) observer.observe(activeRef.current);
    return () => observer.disconnect();
  }, [measure, value]);

  React.useEffect(() => {
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) measure();
        })
        .catch(() => {
          // Abaikan: pengukuran via ResizeObserver sudah cukup.
        });
    }
    return () => {
      cancelled = true;
    };
  }, [measure]);

  React.useEffect(() => {
    if (firstValueRef.current) {
      firstValueRef.current = false;
      return;
    }
    const node = activeRef.current;
    if (!node) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      node.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    } catch {
      // Abaikan: browser lama tanpa dukungan opsi scrollIntoView.
    }
  }, [value]);

  return {
    listRef,
    itemRef,
    ready: box !== null,
    style: box
      ? { transform: `translateX(${box.x}px)`, width: box.width }
      : { opacity: 0 },
  };
}
