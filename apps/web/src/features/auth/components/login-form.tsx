import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  loginFormSchema,
  type LoginFormValues,
} from "~/features/auth/schemas/login-form-schema";
import { useLogin } from "~/features/auth/hooks/use-login";

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { loginAsync, isPending, error: mutationError } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginAsync(values);
      onSuccess?.();
    } catch {
      form.setError("root", { message: "Email atau password salah" });
    }
  };

  const isSubmitting = form.formState.isSubmitting || isPending;
  const rootError =
    form.formState.errors.root?.message ?? mutationError?.message;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-2"
    >
      <FieldGroup className="gap-2">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1">
              <FieldLabel
                htmlFor="login-email"
                className="text-[13px] font-medium text-[#1c2420]"
              >
                Alamat email
              </FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="nama@contoh.id"
                aria-invalid={fieldState.invalid}
                className="h-10 rounded-xl border-[#d9e0d5] bg-white px-3.5 text-sm placeholder:text-[#9aa79c] focus-visible:border-[#1e3a2a] focus-visible:ring-[#1e3a2a]/20 aria-invalid:border-[#c2704e] aria-invalid:ring-1 aria-invalid:ring-[#c2704e]/15"
              />
              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error]}
                  className="text-[11px] leading-tight"
                />
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1">
              <div className="flex items-baseline justify-between">
                <FieldLabel
                  htmlFor="login-password"
                  className="text-[13px] font-medium text-[#1c2420]"
                >
                  Kata sandi
                </FieldLabel>
                <span className="text-[11px] text-[#8a978c]">
                  Min. 8 karakter
                </span>
              </div>
              <div className="relative">
                <Input
                  {...field}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tulis kata sandimu"
                  aria-invalid={fieldState.invalid}
                  className="h-10 rounded-xl border-[#d9e0d5] bg-white pr-10 pl-3.5 text-sm placeholder:text-[#9aa79c] focus-visible:border-[#1e3a2a] focus-visible:ring-[#1e3a2a]/20 aria-invalid:border-[#c2704e] aria-invalid:ring-1 aria-invalid:ring-[#c2704e]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-1.5 text-[#7a8a7c] hover:bg-[#eef2ea] hover:text-[#1e3a2a] focus-visible:outline-2 focus-visible:outline-[#1e3a2a]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error]}
                  className="text-[11px] leading-tight"
                />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <div aria-live="polite">
        {rootError ? (
          <div
            role="alert"
            className="rounded-xl border border-[#c2704e]/30 bg-[#c2704e]/10 px-3.5 py-1.5 text-xs leading-snug text-[#8a3d22]"
          >
            {rootError}. Periksa kembali dan coba lagi.
          </div>
        ) : null}

        {form.formState.isSubmitSuccessful && !rootError ? (
          <div
            role="status"
            className="rounded-xl border border-[#1e3a2a]/20 bg-[#dde6d9] px-3.5 py-1.5 text-xs text-[#1e3a2a]"
          >
            Berhasil masuk (mock). Menyiapkan kebunmu...
          </div>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-10 w-full rounded-xl bg-[#1e3a2a] text-sm font-semibold text-[#f6f3eb] hover:bg-[#2a4d38] active:translate-y-px"
      >
        {isSubmitting ? "Merangkai..." : "Masuk ke Delysa"}
      </Button>
    </form>
  );
}
