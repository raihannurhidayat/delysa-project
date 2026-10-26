import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AUTH_API_NOT_CONFIGURED } from "~/features/auth/api/auth";
import { isAuthConfigured } from "~/features/shop/api/http";

export function AuthConfigNotice() {
  if (isAuthConfigured()) return null;

  return (
    <Alert className="mt-3 rounded-xl border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[#92400E]">
      <AlertCircle aria-hidden="true" />
      <AlertDescription className="text-[11px] leading-relaxed text-[#92400E]">
        {AUTH_API_NOT_CONFIGURED}
      </AlertDescription>
    </Alert>
  );
}
