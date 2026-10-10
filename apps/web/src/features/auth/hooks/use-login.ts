import { useMutation } from "@tanstack/react-query";
import type { LoginFormValues } from "~/features/auth/schemas/login-form-schema";

type MockLoginResult = { ok: true };

async function mockLogin(values: LoginFormValues): Promise<MockLoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (values.email === "gagal@delysa.id") {
    throw new Error("Email atau password salah");
  }
  return { ok: true };
}

export function useLogin() {
  const mutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: mockLogin,
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}
