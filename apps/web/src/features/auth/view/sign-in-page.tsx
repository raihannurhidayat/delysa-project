import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { FieldSeparator } from "~/components/ui/field";
import { GoogleButton } from "~/features/auth/components/google-button";
import { LoginForm } from "~/features/auth/components/login-form";
import { LoginIllustration } from "~/features/auth/components/login-illustration";

export default function SignInPage() {
  return (
    <div className="grid h-dvh overflow-hidden bg-[#f6f3eb] text-[#1c2420] lg:grid-cols-[1fr_1fr]">
      <section className="flex items-center justify-center overflow-y-auto px-6 py-3 sm:px-12 lg:overflow-hidden">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e3a2a] text-[#f6f3eb]">
              <Leaf size={14} aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-base tracking-tight">Delysa</p>
              <p className="text-[10px] tracking-[0.18em] text-[#5c6b5e] uppercase">
                Florist Store
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] font-medium tracking-[0.2em] text-[#7a8a7c] uppercase">
            Masuk ke studio bunga
          </p>
          <h1 className="mt-1 font-serif text-[clamp(1.35rem,1rem+1vw,1.65rem)] leading-[1.12] tracking-tight text-balance">
            Selamat datang kembali ke kebun kami.
          </h1>
          <p className="mt-1 max-w-[40ch] text-xs leading-snug text-[#4a5750]">
            Masuk untuk merangkai pesanan, melacak buket, dan menyimpan
            favoritmu.
          </p>

          <div className="mt-2.5">
            <GoogleButton />
          </div>

          <div className="my-2">
            <FieldSeparator className="text-xs text-[#8a978c]">
              atau lanjut dengan email
            </FieldSeparator>
          </div>

          <LoginForm />

          <p className="mt-2 text-center text-xs text-[#5c6b5e]">
            Baru di Delysa?{" "}
            <Link
              to="/sign-up"
              className="font-semibold text-[#1e3a2a] underline decoration-[#c2704e] decoration-2 underline-offset-4 hover:text-[#2a4d38]"
            >
              Buat akun
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <LoginIllustration />
      </aside>
    </div>
  );
}
