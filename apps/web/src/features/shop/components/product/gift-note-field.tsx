import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

export const GIFT_NOTE_MAX = 200;

/**
 * Kartu ucapan PDP: textarea + counter 0/200 + validasi max.
 * `maxLength` mencegah >200; pesan merah bila tepat di batas tempel.
 */
export function GiftNoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const len = value.length;
  const over = len > GIFT_NOTE_MAX;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="gift-note" className="text-xs font-bold text-[#1A1A1A]">
          Teks Kartu Ucapan & Pesan Khusus (Gratis Dicetak)
        </label>
        <span
          className={cn(
            "text-[11px] tabular-nums",
            over ? "font-bold text-[#DC2626]" : "text-[#6B7280]",
          )}
          aria-live="polite"
        >
          {len}/{GIFT_NOTE_MAX}
        </span>
      </div>
      <Textarea
        id="gift-note"
        value={value}
        maxLength={GIFT_NOTE_MAX + 1}
        onChange={(e) => onChange(e.target.value.slice(0, GIFT_NOTE_MAX + 1))}
        placeholder="Tuliskan nama wisudawan / pesan ucapan hangat Anda di sini (maks. 200 karakter)..."
        rows={3}
        aria-invalid={over}
        aria-describedby={over ? "gift-note-error" : undefined}
        className={cn(
          "mt-1.5 bg-white",
          over && "border-[#DC2626] focus-visible:border-[#DC2626]",
        )}
      />
      {over ? (
        <p
          id="gift-note-error"
          role="alert"
          className="mt-1 text-xs text-[#DC2626]"
        >
          Maks. {GIFT_NOTE_MAX} karakter — pesanan tidak dapat dilanjutkan
          sampai dipersingkat.
        </p>
      ) : null}
    </div>
  );
}
