import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { toast } from "~/components/ui/toast";
import type { LoginFormValues } from "~/features/auth/schemas/login-form-schema";
import type { AuthUser } from "@delysa/shared";

export function useLogin() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (values: LoginFormValues): Promise<AuthUser> => login(values),
    onMutate: async (newValues) => {
      // Show loading state during mutation
      await toast.add({
        title: "Sedang memproses login",
        type: "loading",
        id: "login-toast",
      });
      return { email: newValues?.email };
    },
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
      toast.add({
        title: "Login berhasil",
        type: "success",
        id: "login-toast",
      });
    },
    onError: (error) => {
      toast.add({ title: "Login gagal", type: "error", id: "login-toast" });
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
