import {
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  CHECKOUT_STEPS,
  CHECKOUT_STEP_LABELS,
  CHECKOUT_STEP_SHORT_LABELS,
  type CheckoutStep,
} from "../types";

const STEP_ICONS: Record<CheckoutStep, LucideIcon> = {
  review: ShoppingBag,
  alamat: MapPin,
  bayar: CreditCard,
  ringkasan: CheckCircle2,
};

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
}

export function CheckoutStepper({
  currentStep,
  onStepClick,
}: CheckoutStepperProps) {
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Progres checkout" className="w-full">
      <ol className="grid grid-cols-4">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const Icon = STEP_ICONS[step];

          return (
            <li
              key={step}
              className="relative flex flex-col items-center gap-1.5 sm:gap-2"
            >
              {index < CHECKOUT_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-5 left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] rounded-full transition-colors",
                    index < currentIndex ? "bg-[#111111]" : "bg-[#E5E7EB]",
                  )}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  if (isFuture) return;
                  onStepClick(step);
                }}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={isFuture || undefined}
                aria-label={`Langkah ${index + 1}: ${CHECKOUT_STEP_LABELS[step]}${
                  isCompleted ? " (selesai)" : ""
                }`}
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2",
                  isCompleted &&
                    "border-[#111111] bg-[#111111] text-white hover:bg-[#2A2A2A]",
                  isCurrent &&
                    "border-[#FF6B35] bg-white text-[#FF6B35] shadow-[0_0_0_4px_rgba(255,107,53,0.18)]",
                  isFuture &&
                    "cursor-not-allowed border-[#E5E7EB] bg-white text-[#9CA3AF]",
                )}
              >
                {isCompleted ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
              </button>

              <span
                aria-hidden="true"
                className={cn(
                  "max-w-[76px] text-center text-[11px] leading-tight sm:max-w-none sm:text-xs",
                  isCurrent && "font-semibold text-[#1A1A1A]",
                  isCompleted && "font-medium text-[#1A1A1A]",
                  isFuture && "text-[#9CA3AF]",
                )}
              >
                <span className="sm:hidden">
                  {CHECKOUT_STEP_SHORT_LABELS[step]}
                </span>
                <span className="hidden sm:inline">
                  {CHECKOUT_STEP_LABELS[step]}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
