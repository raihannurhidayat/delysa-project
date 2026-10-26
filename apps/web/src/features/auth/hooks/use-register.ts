import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import type { RegisterFormValues } from "~/features/auth/schemas/register-form-schema";
import type { AuthUser } from "@delysa/shared";

export function useRegister() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (values: RegisterFormValues): Promise<AuthUser> =>
      register(values),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
    },
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    reset: mutation.reset,
  };
}
