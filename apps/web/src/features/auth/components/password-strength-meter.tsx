import { cn } from "~/lib/utils";
import { getPasswordStrength } from "~/lib/password-strength";

type PasswordStrengthMeterProps = {
  password: string;
  id?: string;
};

export function PasswordStrengthMeter({
  password,
  id = "register-password-strength",
}: PasswordStrengthMeterProps) {
  const { score, label } = getPasswordStrength(password);
  const strong = score === 4;

  return (
    <div id={id}>
      <div aria-hidden="true" className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < score ? "bg-[#22C55E]" : "bg-[#E5E7EB]",
            )}
          />
        ))}
      </div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[11px] text-[#6B7280]">Keamanan Sandi</span>
        <span
          aria-live="polite"
          className="inline-flex items-center gap-1 text-[11px] font-medium"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              strong ? "bg-[#22C55E]" : "bg-[#D1D5DB]",
            )}
          />
          <span className={strong ? "text-[#15803D]" : "text-[#6B7280]"}>
            {password.length === 0 ? "Belum diisi" : label}
          </span>
        </span>
      </div>
    </div>
  );
}
