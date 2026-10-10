import { useMutation } from "@tanstack/react-query";
import type { RegisterFormValues } from "~/features/auth/schemas/register-form-schema";

type MockRegisterResult = { ok: true };

async function mockRegister(
  values: RegisterFormValues,
): Promise<MockRegisterResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (values.email === "terdaftar@delysa.id") {
    throw new Error("Email sudah terdaftar");
  }
  return { ok: true };
}

export function useRegister() {
  const mutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: mockRegister,
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}
