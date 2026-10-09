function Sprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 160"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M60 150 C60 100 60 60 60 14" />
      <path
        d="M60 110 C40 104 26 90 24 70 C44 74 58 88 60 110Z"
        fill="currentColor"
        stroke="none"
        opacity="0.35"
      />
      <path
        d="M60 84 C80 78 94 64 96 44 C76 48 62 62 60 84Z"
        fill="currentColor"
        stroke="none"
        opacity="0.5"
      />
      <path
        d="M60 56 C48 52 40 42 39 30 C51 32 59 42 60 56Z"
        fill="currentColor"
        stroke="none"
        opacity="0.7"
      />
    </svg>
  );
}

export function LoginIllustration() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#1e3a2a] p-8 text-[#eef2ea]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#2a4d38]/80 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#0f2218]/70 blur-2xl"
      />
      <Sprig className="pointer-events-none absolute top-8 right-6 h-32 w-24 text-[#dde6d9]/25" />
      <Sprig className="pointer-events-none absolute bottom-20 left-6 h-36 w-28 -scale-x-100 text-[#dde6d9]/20" />

      <div className="relative flex items-center justify-between text-xs tracking-[0.2em] uppercase opacity-80">
        <span>Placeholder visual</span>
        <span className="rounded-full border border-white/25 px-3 py-1">
          Musim semi
        </span>
      </div>

      <blockquote className="relative max-w-[22ch] font-serif text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] leading-[1.1] tracking-tight text-balance">
        “Bunga segar, dirangkai pagi ini.”
      </blockquote>

      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dde6d9] font-serif text-lg text-[#1e3a2a]">
            D
          </span>
          <div className="text-sm leading-snug">
            <p className="font-medium">Rangkaian hari ini</p>
            <p className="text-white/70">
              Peony · Mawar · Eustoma — placeholder foto
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-white/60">
          Panel kanan ini placeholder ringan. Ganti dengan foto studio saat aset
          final siap.
        </p>
      </div>
    </div>
  );
}
