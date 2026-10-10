import { Link } from "@tanstack/react-router";
import { FieldSeparator } from "~/components/ui/field";
import { GoogleButton } from "~/features/auth/components/google-button";
import { LoginForm } from "~/features/auth/components/login-form";
import { SigninShowcase } from "~/features/auth/components/signin-showcase";

export default function SignInPage() {
  return (
    <div className="grid min-h-dvh bg-[#FFFFFF] text-[#1A1A1A] lg:grid-cols-[1fr_1fr]">
      <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:py-6">
        <div className="w-full max-w-[440px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#1A1A1A]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#111111]"
            />
            PORTAL PELANGGAN &amp; ATELIER
          </p>
          <h1 className="mt-4 text-[clamp(1.9rem,1.4rem+1.5vw,2.5rem)] leading-[1.1] font-semibold tracking-tight text-balance">
            Selamat Datang Kembali
          </h1>
          <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[#6B7280]">
            Masuk untuk melanjutkan pesanan buket eksklusif Anda atau kelola
            status pengiriman.
          </p>

          <div className="mt-6">
            <GoogleButton />
          </div>

          <div className="my-5">
            <FieldSeparator className="text-[11px] font-medium tracking-[0.12em] text-[#9CA3AF]">
              ATAU LANJUT DENGAN EMAIL
            </FieldSeparator>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Baru pertama kali di Delysa Florist?{" "}
            <Link
              to="/sign-up"
              className="font-semibold text-[#FF6B35] hover:text-[#E55A24]"
            >
              Buat Akun Baru
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden p-4 lg:block">
        <SigninShowcase
          imageSrc="https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop"
          imageAlt="Buket mawar putih dan peach di vas hitam"
        />
      </aside>
    </div>
  );
}
