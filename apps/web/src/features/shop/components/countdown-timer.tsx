import { endOfDay, useCountdown } from "~/features/shop/hooks/use-countdown";

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span
        aria-hidden="true"
        className="min-w-9 rounded-md bg-[#111111] px-1.5 py-1 text-center text-sm font-bold text-white tabular-nums"
      >
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-[#6B7280]">{label}</span>
    </span>
  );
}

/**
 * Hitung mundur flash sale. Teks statis tanpa animasi; screen reader
 * mendapat ringkasan lewat aria-label (tanpa live-region agresif).
 */
export function CountdownTimer({
  label = "Berakhir dalam",
}: {
  label?: string;
}) {
  const { hours, minutes, seconds } = useCountdown(endOfDay());

  return (
    <span className="flex items-center gap-2">
      <span className="text-[11px] font-bold tracking-wide text-[#6B7280] uppercase">
        {label}
      </span>
      <span
        role="timer"
        aria-label={`Flash sale berakhir dalam ${hours} jam ${minutes} menit ${seconds} detik`}
        className="flex items-start gap-1"
      >
        <Digit value={hours} label="Jam" />
        <span aria-hidden="true" className="pt-1 text-sm font-bold">
          :
        </span>
        <Digit value={minutes} label="Mnt" />
        <span aria-hidden="true" className="pt-1 text-sm font-bold">
          :
        </span>
        <Digit value={seconds} label="Dtk" />
      </span>
    </span>
  );
}
