import { useEffect, useState } from "react";

export type Countdown = {
  hours: string;
  minutes: string;
  seconds: string;
};

const pad = (n: number) => String(Math.max(n, 0)).padStart(2, "0");

function diffToParts(target: Date, now: Date): Countdown {
  const ms = Math.max(target.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(ms / 1000);
  return {
    hours: pad(Math.floor(totalSeconds / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  };
}

/**
 * Hitung mundur ke target absolut (mis. tengah malam). Render teks statis
 * tanpa animasi sehingga aman untuk `prefers-reduced-motion`.
 */
export function useCountdown(target: Date): Countdown {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return diffToParts(target, now);
}

/** Target default flash sale: tengah malam waktu lokal. */
export function endOfDay(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
