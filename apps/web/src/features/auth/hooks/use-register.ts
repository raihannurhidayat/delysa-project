import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { toast } from "~/components/ui/toast";
import type { RegisterFormValues } from "~/features/auth/schemas/register-form-schema";
import type { AuthUser } from "@delysa/shared";

export function useRegister() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (values: RegisterFormValues): Promise<AuthUser> =>
      register(values),
    onMutate: async (newValues) => {
      // Show loading state during mutation
      await toast.add({
        title: "Sedang memproses registrasi",
        type: "loading",
        id: "toast-register",
      });
      return { email: newValues?.email };
    },
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user);
      toast.add({
        title: "Registrasi berhasil",
        type: "success",
        id: "toast-register",
      });
    },
    onError: (error) => {
      toast.add({
        title: "Registrasi gagal",
        type: "error",
        id: "toast-register",
      });
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
