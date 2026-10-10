import { Link } from "@tanstack/react-router";
import { RegisterForm } from "~/features/auth/components/register-form";
import { SignupShowcase } from "~/features/auth/components/signup-showcase";
import { GoogleButton } from "../components/google-button";

export default function SignUpPage() {
  return (
    <div className="grid min-h-dvh bg-[#FFFFFF] text-[#1A1A1A] lg:h-dvh lg:grid-cols-[1fr_1fr] lg:overflow-hidden">
      <aside className="relative hidden p-3 lg:block">
        <SignupShowcase
          imageSrc="https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop"
          imageAlt="Buket mawar putih dan peach di vas hitam"
        />
      </aside>

      <section className="flex items-center justify-center px-6 py-3 sm:px-12 lg:overflow-y-auto lg:py-2">
        <div className="w-full max-w-[440px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-1 text-[8px] font-semibold tracking-[0.14em] text-[#1A1A1A]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6B35]"
            />
            PORTAL PELANGGAN &amp; DELYSA
          </p>
          <h1 className="mt-2 text-[clamp(1.35rem,1.1rem+1vw,1.75rem)] leading-[1.1] font-semibold tracking-tight text-balance">
            Buat Akun Baru
          </h1>
          <p className="mt-1.5 max-w-[44ch] text-[13px] leading-snug text-[#6B7280]">
            Daftar untuk membeli buket eksklusif Anda
          </p>
          <div className="mt-3">
            <GoogleButton>Lanjut Dengan Google</GoogleButton>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span aria-hidden="true" className="h-px flex-1 bg-[#E5E7EB]" />
            <span className="shrink-0 text-[11px] font-medium tracking-[0.12em] text-[#9CA3AF]">
              ATAU DAFTAR DENGAN EMAIL
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          <RegisterForm />

          <p className="mt-3 text-center text-[13px] text-[#6B7280]">
            Sudah punya akun?{" "}
            <Link
              to="/sign-in"
              className="font-semibold text-[#FF6B35] hover:text-[#E55A24]"
            >
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
