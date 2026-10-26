import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import type { LoginFormValues } from "~/features/auth/schemas/login-form-schema";
import type { AuthUser } from "@delysa/shared";

export function useLogin() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (values: LoginFormValues): Promise<AuthUser> => login(values),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
