import { cn } from "~/lib/utils";

export type VariantOption = {
  id: string;
  label: string;
  sub?: string;
  price?: number;
  disabled?: boolean;
};

/**
 * Selektor varian PDP sebagai button-card terlihat (best practice Baymard:
 * opsi diekspos, bukan dropdown). Satu klik langsung `onChange`, tanpa Apply.
 */
export function VariantSelector({
  title,
  hint,
  options,
  value,
  onChange,
}: {
  title: string;
  hint?: string;
  options: VariantOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-2">
        <legend className="text-xs font-bold text-[#1A1A1A]">{title}</legend>
        {hint ? (
          <span className="text-[11px] text-[#6B7280]">{hint}</span>
        ) : null}
      </div>
      <div
        className="mt-1.5 grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label={title}
      >
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={opt.disabled}
              disabled={opt.disabled}
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-lg border px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-45",
                active
                  ? "border-[#111111] bg-[#111111] text-white"
                  : "border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#9CA3AF]",
              )}
            >
              <span className="block text-xs font-bold">{opt.label}</span>
              {opt.sub ? (
                <span
                  className={cn(
                    "block text-[11px]",
                    active ? "text-white/75" : "text-[#6B7280]",
                  )}
                >
                  {opt.sub}
                </span>
              ) : null}
              {opt.price !== undefined ? (
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] font-semibold tabular-nums",
                    active ? "text-white" : "text-[#1A1A1A]",
                  )}
                >
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 0,
                  }).format(opt.price) === "0"
                    ? ""
                    : `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(opt.price)}`}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
