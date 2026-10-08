# Riset: Warning code-split `PostErrorComponent` / `UserErrorComponent` (TanStack Router)

Tanggal: 2026-10-08. Repo: `apps/web` (`@tanstack/react-router ^1.170.41`).

## Diagnosis

Warning berasal dari compiler plugin TanStack Router (`packages/router-plugin/src/core/code-splitter/compilers.ts`):
setiap identifier yang di-export dari file route dan cocok dengan opsi splittable
(`component`, `loader`, `errorComponent`, `pendingComponent`, `notFoundComponent`, …)
**tetap di file referensi (main bundle)** agar import eksternal tidak rusak — sehingga tidak ikut ter-split. [1]

Di repo ini pelanggarnya:

- `apps/web/src/routes/posts.$postId.tsx:27` — `export function PostErrorComponent`
- `apps/web/src/routes/users.$userId.tsx:18` — `export function UserErrorComponent`

Keduanya hanya wrapper tipis `ErrorComponent` dan tidak di-import dari file lain
(hasil grep: hanya dirujuk di file route-nya sendiri sebagai `errorComponent:`).

## Pendekatan (dari sumber primer)

1. **Hapus `export` (unexport), definisi tetap di file route.** Fungsi tanpa export ikut masuk
   split chunk bersama route. Ini rekomendasi resmi docs "Do not export route properties". [2][3]
2. **Pindah ke file non-route lalu import.** Cth `src/components/RouteErrorBoundary.tsx`,
   lalu `errorComponent: RouteErrorBoundary`. Cocok bila dipakai banyak route. [1]
3. **Hapus route demo sekalian** (konteks tambahan): `posts.*` dan `users.*` adalah sisa template
   demo TanStack, bukan fitur Delysa. User menyetujui scope "bersihkan sekalian".
   Maka pendekatan 1/2 hanya relevan bila komponen error-nya dipakai ulang; bila route-nya
   dihapus, warning hilang dengan sendirinya.

Anti-pattern yang dilarang docs: mengekspor `component`/`loader`/`errorComponent`/
`notFoundComponent` dari file route. [2]

## Catatan versi & gotcha

- `src/router.tsx:18` sudah memasang `defaultErrorComponent: DefaultCatchBoundary`
  (komponen non-route di `src/components/DefaultCatchBoundary.tsx`), sehingga
  `PostErrorComponent`/`UserErrorComponent` yang hanya me-render `ErrorComponent` polos
  sebenarnya redundan — fallback global sudah lebih baik (ada tombol Try Again/Go Back).
- `routeTree.gen.ts` adalah file generated — setelah hapus route, regenerate otomatis
  via plugin (jangan edit manual).
- Tidak ada import eksternal ke `PostErrorComponent`/`UserErrorComponent` (terverifikasi grep),
  jadi opsi hapus/pindah aman tanpa breaking change.

## Rekomendasi

Hapus seluruh route demo (`posts.*`, `users.*`, `utils/posts.tsx`, `utils/users.tsx`,
nav links di `__root.tsx`) dan biarkan `defaultErrorComponent` global menangani error.
Tidak perlu file error-component baru. Jika nanti route Delysa butuh error UI khusus,
buat di `src/components/` (non-route) dan import — bukan export dari file route.

Celah yang belum terverifikasi: ukuran bundle sebelum/sesudah (butuh `vite build --stats`;
tidak diukur di fase rencana).

## Sumber

[1] https://github.com/TanStack/router/blob/a4154714/packages/router-plugin/src/core/code-splitter/compilers.ts
[2] https://tanstack.com/router/latest/docs/guide/automatic-code-splitting
[3] https://tanstack.com/router/latest/docs/guide/automatic-code-splitting.md
    (context7 `/tanstack/router`: pola unexported component + `createLazyFileRoute` manual)
