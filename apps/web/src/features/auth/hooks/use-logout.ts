import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { logout } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { ApiError } from "~/features/shop/api/http";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      void router.invalidate();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(sessionQueryKey, null);
        void router.invalidate();
      }
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
