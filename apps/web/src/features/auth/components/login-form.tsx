import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  authErrorMessage,
  firstFieldErrors,
} from "~/features/auth/lib/auth-errors";
import {
  loginFormSchema,
  type LoginFormValues,
} from "~/features/auth/schemas/login-form-schema";
import { useLogin } from "~/features/auth/hooks/use-login";

type LoginFormProps = {
  onSuccess?: (user: AuthUser) => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { loginAsync, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const onSubmit = async (values: LoginFormValues) => {
    form.clearErrors("root");
    try {
      const user = await loginAsync(values);
      onSuccess?.(user);
    } catch (error) {
      const fieldErrors = firstFieldErrors(error);
      for (const field of ["email", "password"] as const) {
        const message = fieldErrors?.[field];
        if (message) form.setError(field, { message });
      }
      form.setError("root", { message: authErrorMessage(error, "login") });
    }
  };

  const isSubmitting = form.formState.isSubmitting || isPending;
  const rootError = form.formState.errors.root?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-1.5"
    >
      <FieldGroup className="gap-2">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0.5">
              <FieldLabel
                htmlFor="login-email"
                className="text-[13px] font-medium text-[#1A1A1A]"
              >
                Email{" "}
                <span aria-hidden="true" className="text-[#FF6B35]">
                  *
                </span>
              </FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="contoh: nama@domain.com"
                aria-invalid={fieldState.invalid}
                className="h-10 rounded-xl border-[#E5E7EB] bg-[#FFFFFF] px-3.5 text-sm placeholder:text-[#9CA3AF] focus-visible:border-[#111111] focus-visible:ring-[#111111]/15 aria-invalid:border-[#DC2626] aria-invalid:ring-1 aria-invalid:ring-[#DC2626]/15"
              />
              <div className="min-h-[14px]">
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error]}
                    className="text-[11px] leading-tight"
                  />
                )}
              </div>
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0.5">
              <FieldLabel
                htmlFor="login-password"
                className="text-[13px] font-medium text-[#1A1A1A]"
              >
                Kata Sandi{" "}
                <span aria-hidden="true" className="text-[#FF6B35]">
                  *
                </span>
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi akun"
                  aria-invalid={fieldState.invalid}
                  className="h-10 rounded-xl border-[#E5E7EB] bg-[#FFFFFF] pr-10 pl-3.5 text-sm placeholder:text-[#9CA3AF] focus-visible:border-[#111111] focus-visible:ring-[#111111]/15 aria-invalid:border-[#DC2626] aria-invalid:ring-1 aria-invalid:ring-[#DC2626]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-[#111111]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="min-h-[14px]">
                {fieldState.invalid && (
                  <FieldError
                    errors={[fieldState.error]}
                    className="text-[11px] leading-tight"
                  />
                )}
              </div>
            </Field>
          )}
        />
      </FieldGroup>

      {rootError ? (
        <Alert
          variant="destructive"
          className="rounded-xl border-[#FECACA] bg-[#FEF2F2] px-3 py-2"
        >
          <AlertDescription className="text-[12px] leading-snug text-[#B91C1C]">
            {rootError}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-11 cursor-pointer w-full rounded-xl bg-[#111111] text-sm font-semibold text-[#FFFFFF] hover:bg-[#2A2A2A] active:translate-y-px"
      >
        {isSubmitting ? "Merangkai..." : "Masuk ke Akun"}
        {!isSubmitting ? <ArrowRight size={16} aria-hidden="true" /> : null}
      </Button>
    </form>
  );
}
