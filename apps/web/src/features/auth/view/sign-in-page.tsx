import { Link, useNavigate } from "@tanstack/react-router";
import type { AuthUser } from "@delysa/shared";
import { AuthConfigNotice } from "~/features/auth/components/auth-config-notice";
import { LoginForm } from "~/features/auth/components/login-form";
import { SigninShowcase } from "~/features/auth/components/signin-showcase";
import { roleHome } from "~/features/auth/lib/role-home";

export default function SignInPage() {
  const navigate = useNavigate();

  const handleSuccess = (user: AuthUser) => {
    void navigate({ to: roleHome(user.role), replace: true });
  };

  return (
    <div className="grid min-h-dvh bg-[#FFFFFF] text-[#1A1A1A] lg:h-dvh lg:grid-cols-[1fr_1fr] lg:overflow-hidden">
      <section className="flex items-center justify-center px-6 py-6 sm:px-12 lg:overflow-y-auto lg:py-4">
        <div className="w-full max-w-[440px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-1 text-[8px] font-semibold tracking-[0.14em] text-[#1A1A1A]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-pulse"
            />
            PORTAL PELANGGAN &amp; DELYSA
          </p>
          <h1 className="mt-3 text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-[1.1] font-semibold tracking-tight text-balance">
            Selamat Datang Kembali
          </h1>
          <p className="mt-1.5 max-w-[44ch] text-[13px] leading-snug text-[#6B7280]">
            Masuk untuk melanjutkan pesanan buket eksklusif Anda
          </p>

          <AuthConfigNotice />

          <div className="mt-4">
            <LoginForm onSuccess={handleSuccess} />
          </div>

          <p className="mt-4 text-center text-[13px] text-[#6B7280]">
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

      <aside className="relative hidden p-3 lg:block">
        <SigninShowcase
          imageSrc="https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop"
          imageAlt="Buket mawar putih dan peach di vas hitam"
        />
      </aside>
    </div>
  );
}
