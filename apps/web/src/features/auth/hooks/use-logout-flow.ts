import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authErrorMessage } from "~/features/auth/lib/auth-errors";
import { ApiError } from "~/features/shop/api/http";
import { useLogout } from "./use-logout";

export function useLogoutFlow() {
  const navigate = useNavigate();
  const { logoutAsync, isPending } = useLogout();
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setError(null);

    try {
      await logoutAsync();
      void navigate({ to: "/sign-in", replace: true });
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }

      setError(authErrorMessage(cause, "logout"));
    }
  };

  return { logout, isPending, error };
}
