import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { FcGoogle } from "react-icons/fc";
import React from "react";

type GoogleButtonProps = {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function GoogleButton({
  onClick,
  className,
  children,
}: GoogleButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    // UI-only tahap ini: tanpa OAuth, tanpa navigasi.
    window.alert("Login Google segera hadir (UI-only)");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleClick}
      aria-label="Lanjut dengan Google (segera hadir)"
      className={cn(
        "h-10 cursor-pointer w-full rounded-xl border-[#E5E7EB] bg-[#FFFFFF] text-sm font-medium text-[#1A1A1A] hover:border-[#111111]/30 hover:bg-[#F8F9FA]",
        className,
      )}
    >
      <FcGoogle size={20} />
      {children}
    </Button>
  );
}
